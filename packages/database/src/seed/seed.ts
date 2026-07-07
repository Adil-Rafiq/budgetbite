/**
 * `pnpm db:seed` — populates the dev DB with demo data:
 *
 *  - breakfast/lunch/dinner meal types (upserted by key, shared with real data)
 *  - 5 fixture restaurants + menus around the scraper's Lahore point
 *  - a demo user (email+password login, verified) with a profile at that point
 *  - a *completed* weekly budget plan: one succeeded generation with 3 options
 *    per slot, a logged meal choice for every slot, and a closed plan context
 *
 * Idempotent: seeded restaurants are keyed by the `seed-` slug prefix and the
 * demo user by fixed email; both are wiped and re-created on every run.
 * Scraped restaurants and real users are never touched.
 *
 * Run via tsx (not part of the package build's public API).
 */
import { eq, like, sql } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';

import { db, type Transaction } from '../db.js';
import {
  account,
  budgetPlan,
  budgetPlanMealType,
  mealChoice,
  mealPlanGeneration,
  mealSuggestion,
  mealSuggestionItem,
  mealType,
  menuItem,
  planContext,
  restaurant,
  user,
  userProfile,
} from '../schema/index.js';
import {
  DEMO_PLAN,
  DEMO_USER,
  SEED_LOCATION,
  SEED_MEAL_TYPES,
  SEED_RESTAURANTS,
  SEED_SLUG_PREFIX,
  type SeedMenuItemFixture,
  type SeedRestaurantFixture,
} from './fixtures.js';

const money = (n: number): string => n.toFixed(2);

const isoDate = (d: Date): string => {
  const iso = d.toISOString().slice(0, 10);
  return iso;
};

const addDays = (d: Date, days: number): Date => {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
};

/** Indexed access that narrows away `undefined` (noUncheckedIndexedAccess). */
const at = <T>(arr: readonly T[], i: number): T => {
  const value = arr[i];
  if (value === undefined) throw new Error(`Seed fixture index out of range: ${i}`);
  return value;
};

const mustGet = <K, V>(map: Map<K, V>, key: K): V => {
  const value = map.get(key);
  if (value === undefined) throw new Error(`Seed lookup failed for key: ${String(key)}`);
  return value;
};

/** One in-memory suggestion option before any DB ids exist. */
interface PlannedOption {
  slotDate: string;
  mealTypeKey: string;
  optionIndex: number;
  restaurant: SeedRestaurantFixture;
  items: SeedMenuItemFixture[];
  estimatedPrice: number;
}

/**
 * Deterministically composes 3 options per (day, meal type) slot from the
 * fixture pools — restaurants rotate by day so the demo plan looks varied,
 * and the 3rd option is always a 2-item combo.
 */
const planOptions = (slotDates: string[]): PlannedOption[] => {
  const options: PlannedOption[] = [];
  slotDates.forEach((slotDate, dayIdx) => {
    for (const { key: mealTypeKey } of SEED_MEAL_TYPES) {
      const pool = SEED_RESTAURANTS.filter((r) => r.slots.includes(mealTypeKey));
      for (let optionIndex = 0; optionIndex < DEMO_PLAN.optionsPerSlot; optionIndex++) {
        const rest = at(pool, (dayIdx + optionIndex) % pool.length);
        const base = (dayIdx * DEMO_PLAN.optionsPerSlot + optionIndex) % rest.items.length;
        const items = [at(rest.items, base)];
        if (optionIndex === DEMO_PLAN.optionsPerSlot - 1 && rest.items.length > 1) {
          items.push(at(rest.items, (base + 1) % rest.items.length));
        }
        options.push({
          slotDate,
          mealTypeKey,
          optionIndex,
          restaurant: rest,
          items,
          estimatedPrice: items.reduce((sum, i) => sum + i.price, 0),
        });
      }
    }
  });
  return options;
};

const upsertMealTypes = async (tx: Transaction): Promise<Map<string, string>> => {
  const rows = await tx
    .insert(mealType)
    .values(SEED_MEAL_TYPES.map((mt) => ({ ...mt, active: true })))
    .onConflictDoUpdate({
      target: mealType.key,
      set: {
        label: sql`excluded.label`,
        sortOrder: sql`excluded.sort_order`,
        active: sql`excluded.active`,
      },
    })
    .returning({ id: mealType.id, key: mealType.key });
  return new Map(rows.map((r) => [r.key, r.id]));
};

const seed = async (): Promise<void> => {
  const passwordHash = await hashPassword(DEMO_USER.password);
  const now = new Date();

  const endDate = addDays(now, -DEMO_PLAN.endedDaysAgo);
  const startDate = addDays(endDate, -(DEMO_PLAN.days - 1));
  const slotDates = Array.from({ length: DEMO_PLAN.days }, (_, i) =>
    isoDate(addDays(startDate, i)),
  );

  const options = planOptions(slotDates);

  // Chosen option + actual spend per slot, deterministic so re-runs are stable.
  const choices = slotDates.flatMap((slotDate, dayIdx) =>
    SEED_MEAL_TYPES.map(({ key: mealTypeKey }, mtIdx) => {
      const chosenIndex = (dayIdx + mtIdx) % DEMO_PLAN.optionsPerSlot;
      const option = options.find(
        (o) =>
          o.slotDate === slotDate && o.mealTypeKey === mealTypeKey && o.optionIndex === chosenIndex,
      );
      if (!option) throw new Error(`No planned option for ${slotDate}/${mealTypeKey}`);
      const jitter = (((dayIdx * 7 + mtIdx * 3) % 11) - 5) * 10; // -50..+50 PKR
      return {
        slotDate,
        mealTypeKey,
        mtIdx,
        option,
        actualAmountSpent: Math.max(50, option.estimatedPrice + jitter),
      };
    }),
  );

  const totalSpent = choices.reduce((sum, c) => sum + c.actualAmountSpent, 0);
  // Pad the budget above actual spend (rounded up to 100 PKR) so the demo
  // reads as "completed under budget".
  const totalBudget = Math.ceil((totalSpent * DEMO_PLAN.budgetPaddingRatio) / 100) * 100;
  const totalMeals = DEMO_PLAN.days * DEMO_PLAN.mealsPerDay;

  await db.transaction(async (tx) => {
    const mealTypeIdByKey = await upsertMealTypes(tx);

    // Wipe previous seed output. Cascades take care of menus, the plan,
    // generations, suggestions and choices hanging off these rows.
    await tx.delete(user).where(eq(user.email, DEMO_USER.email));
    await tx.delete(restaurant).where(like(restaurant.slug, `${SEED_SLUG_PREFIX}%`));

    const restaurantRows = await tx
      .insert(restaurant)
      .values(
        SEED_RESTAURANTS.map((r) => ({
          source: 'community',
          name: r.name,
          slug: r.slug,
          phone: r.phone,
          latitude: String(r.latitude),
          longitude: String(r.longitude),
          deliveryFee: money(r.deliveryFee),
          minimumOrder: money(r.minimumOrder),
          rating: r.rating.toFixed(2),
          ratingCount: r.ratingCount,
        })),
      )
      .returning({ id: restaurant.id, slug: restaurant.slug });
    const restaurantIdBySlug = new Map(restaurantRows.map((r) => [r.slug ?? '', r.id]));

    const menuItemRows = await tx
      .insert(menuItem)
      .values(
        SEED_RESTAURANTS.flatMap((r) =>
          r.items.map((item) => ({
            restaurantId: mustGet(restaurantIdBySlug, r.slug),
            name: item.name,
            description: item.description,
            price: money(item.price),
          })),
        ),
      )
      .returning({ id: menuItem.id, restaurantId: menuItem.restaurantId, name: menuItem.name });
    const menuItemIdByKey = new Map(menuItemRows.map((m) => [`${m.restaurantId}|${m.name}`, m.id]));
    const menuItemId = (r: SeedRestaurantFixture, item: SeedMenuItemFixture): string =>
      mustGet(menuItemIdByKey, `${mustGet(restaurantIdBySlug, r.slug)}|${item.name}`);

    const [demoUser] = await tx
      .insert(user)
      .values({ name: DEMO_USER.name, email: DEMO_USER.email, emailVerified: true })
      .returning({ id: user.id });
    if (!demoUser) throw new Error('Demo user insert failed');

    await tx.insert(account).values({
      accountId: demoUser.id,
      providerId: 'credential',
      userId: demoUser.id,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(userProfile).values({
      userId: demoUser.id,
      latitude: SEED_LOCATION.latitude,
      longitude: SEED_LOCATION.longitude,
      dietaryPreferences: [...DEMO_USER.dietaryPreferences],
      allergens: [...DEMO_USER.allergens],
    });

    const [plan] = await tx
      .insert(budgetPlan)
      .values({
        userId: demoUser.id,
        planType: DEMO_PLAN.planType,
        totalBudget: money(totalBudget),
        startDate: isoDate(startDate),
        endDate: isoDate(endDate),
        mealsPerDay: DEMO_PLAN.mealsPerDay,
        status: 'completed',
      })
      .returning({ id: budgetPlan.id });
    if (!plan) throw new Error('Budget plan insert failed');

    await tx.insert(budgetPlanMealType).values(
      SEED_MEAL_TYPES.map((mt, position) => ({
        budgetPlanId: plan.id,
        mealTypeId: mustGet(mealTypeIdByKey, mt.key),
        position,
      })),
    );

    const generatedAt = new Date(`${isoDate(startDate)}T08:00:00Z`);
    const [generation] = await tx
      .insert(mealPlanGeneration)
      .values({
        budgetPlanId: plan.id,
        status: 'succeeded',
        generatedAt,
        completedAt: new Date(generatedAt.getTime() + 30_000),
      })
      .returning({ id: mealPlanGeneration.id });
    if (!generation) throw new Error('Generation insert failed');

    const suggestionRows = await tx
      .insert(mealSuggestion)
      .values(
        options.map((o) => ({
          generationId: generation.id,
          slotDate: o.slotDate,
          mealTypeId: mustGet(mealTypeIdByKey, o.mealTypeKey),
          optionIndex: o.optionIndex,
          restaurantId: mustGet(restaurantIdBySlug, o.restaurant.slug),
          estimatedPrice: money(o.estimatedPrice),
        })),
      )
      .returning({
        id: mealSuggestion.id,
        slotDate: mealSuggestion.slotDate,
        mealTypeId: mealSuggestion.mealTypeId,
        optionIndex: mealSuggestion.optionIndex,
      });
    const suggestionIdBySlot = new Map(
      suggestionRows.map((s) => [`${s.slotDate}|${s.mealTypeId}|${s.optionIndex}`, s.id]),
    );
    const suggestionId = (o: PlannedOption): string =>
      mustGet(
        suggestionIdBySlot,
        `${o.slotDate}|${mustGet(mealTypeIdByKey, o.mealTypeKey)}|${o.optionIndex}`,
      );

    await tx.insert(mealSuggestionItem).values(
      options.flatMap((o) =>
        o.items.map((item, itemIndex) => ({
          suggestionId: suggestionId(o),
          itemIndex,
          menuItemId: menuItemId(o.restaurant, item),
          estimatedPrice: money(item.price),
        })),
      ),
    );

    await tx.insert(mealChoice).values(
      choices.map((c) => ({
        userId: demoUser.id,
        budgetPlanId: plan.id,
        slotDate: c.slotDate,
        mealTypeId: mustGet(mealTypeIdByKey, c.mealTypeKey),
        suggestionId: suggestionId(c.option),
        restaurantId: mustGet(restaurantIdBySlug, c.option.restaurant.slug),
        menuItemId: menuItemId(c.option.restaurant, at(c.option.items, 0)),
        actualAmountSpent: money(c.actualAmountSpent),
        restaurantName: c.option.restaurant.name,
        createdAt: new Date(`${c.slotDate}T${String(8 + c.mtIdx * 5).padStart(2, '0')}:30:00Z`),
      })),
    );

    await tx.insert(planContext).values({
      budgetPlanId: plan.id,
      totalBudget: money(totalBudget),
      amountSpent: money(totalSpent),
      amountRemaining: money(totalBudget - totalSpent),
      totalMeals,
      mealsConsumed: totalMeals,
      mealsRemaining: 0,
      avgBudgetPerRemainingMeal: money(0),
      cumulativeVariance: money(totalBudget - totalSpent),
    });
  });

  console.log('✅ Seed complete');
  console.log(`   Restaurants: ${SEED_RESTAURANTS.length} (slug prefix "${SEED_SLUG_PREFIX}")`);
  console.log(`   Menu items:  ${SEED_RESTAURANTS.reduce((sum, r) => sum + r.items.length, 0)}`);
  console.log(`   Demo login:  ${DEMO_USER.email} / ${DEMO_USER.password}`);
  console.log(
    `   Plan:        completed weekly ${isoDate(startDate)} → ${isoDate(endDate)}, ` +
      `spent ${money(totalSpent)} of ${money(totalBudget)} PKR across ${totalMeals} meals`,
  );
};

try {
  await seed();
} finally {
  await db.$client.end();
}
