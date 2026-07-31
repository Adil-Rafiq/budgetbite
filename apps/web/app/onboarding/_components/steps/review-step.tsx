'use client';

import { Bell, BellOff, MapPin, Salad, Wallet } from 'lucide-react';
import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';
import { ONBOARDING_NEARBY_RADIUS_KM, ONBOARDING_STEPS } from '@/app/onboarding/constants';
import { useRestaurants } from '@/hooks/use-restaurant';
import { formatPKR } from '@/lib/currency';
import { FOCUS_RING } from '@/lib/focus-ring';
import { formatTimeOfDay } from '@/lib/time';

const STEP_INDEX = Object.fromEntries(
  ONBOARDING_STEPS.map((step, index) => [step.id, index]),
) as Record<string, number>;

const cardClass = 'rounded-[20px] border border-sage bg-white shadow-sm';

interface SectionProps {
  icon: typeof MapPin;
  title: string;
  editStep: number;
  editLabel: string;
  children: React.ReactNode;
}

const Section = ({ icon: Icon, title, editStep, editLabel, children }: SectionProps) => {
  const { actions } = useOnboardingContext();

  return (
    <section className={cardClass}>
      <div className="flex items-center justify-between gap-3 border-b border-sage/70 px-5 py-3">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate">
          <Icon aria-hidden className="h-3.5 w-3.5 text-green-deep" />
          {title}
        </h2>
        <button
          type="button"
          onClick={() => actions.goToStep(editStep)}
          className={`-mr-2 min-h-11 rounded-lg px-2 text-xs font-semibold text-green-deep underline underline-offset-2 transition-colors hover:text-charcoal ${FOCUS_RING}`}
        >
          {editLabel}
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
};

/** Restaurant count for the picked spot — the same figure shown on step 1. */
const NearbyCount = ({ latitude, longitude }: { latitude: number; longitude: number }) => {
  const query = useRestaurants({
    userLat: latitude,
    userLng: longitude,
    maxDistanceKm: ONBOARDING_NEARBY_RADIUS_KM,
    sort: 'distance',
    limit: 1,
  });

  if (query.isLoading || query.isError) return null;

  const total = query.data?.meta.total ?? 0;
  return (
    <p className="mt-1 text-xs text-slate">
      {total} {total === 1 ? 'restaurant' : 'restaurants'} within {ONBOARDING_NEARBY_RADIUS_KM} km
      to plan from.
    </p>
  );
};

export const ReviewStep = () => {
  const { steps } = useOnboardingContext();
  const { location, dietary, budget, notifications } = steps;
  const { breakdown } = budget;

  // Continue is gated on a complete budget, so this should be unreachable —
  // but a money screen must never render "₨ NaN", so read it from a guarded
  // value rather than trusting the gate.
  const totalBudget = Number.isFinite(budget.values.totalBudget) ? budget.values.totalBudget : 0;

  const selectedMealTypes = budget.mealTypeOptions.filter((type) =>
    budget.values.selectedMealTypeIds.includes(type.id),
  );
  const enabledReminders = notifications.values.slots.filter((slot) => slot.enabled);

  return (
    <div className="flex flex-col gap-4">
      {/* ── The number this whole product is about, stated once, plainly. ── */}
      <div className="rounded-[20px] border border-green/40 bg-green/5 px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate">
          Your budget per meal
        </p>
        <p className="mt-1 font-display text-4xl font-bold text-charcoal sm:text-5xl">
          {formatPKR(breakdown.perMeal)}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          {formatPKR(totalBudget)} over {breakdown.days} days · {breakdown.totalMeals} meals · about{' '}
          {formatPKR(breakdown.perDay)} a day. Every suggestion has to fit what&apos;s left.
        </p>
      </div>

      <Section
        icon={MapPin}
        title="Where you eat"
        editStep={STEP_INDEX.location ?? 0}
        editLabel="Change"
      >
        {typeof location.values.latitude === 'number' &&
        typeof location.values.longitude === 'number' ? (
          <>
            <p className="text-sm font-medium tabular-nums text-charcoal">
              {location.values.latitude.toFixed(4)}, {location.values.longitude.toFixed(4)}
            </p>
            <NearbyCount
              latitude={location.values.latitude}
              longitude={location.values.longitude}
            />
          </>
        ) : (
          <p className="text-sm italic text-slate">No location set</p>
        )}
      </Section>

      <Section
        icon={Salad}
        title="Food preferences"
        editStep={STEP_INDEX.dietary ?? 1}
        editLabel="Change"
      >
        {dietary.values.dietaryPreferences.length === 0 && dietary.values.allergens.length === 0 ? (
          <p className="text-sm italic text-slate">
            Nothing set — the AI will suggest from everything nearby.
          </p>
        ) : (
          <dl className="flex flex-col gap-3">
            {dietary.values.dietaryPreferences.length > 0 && (
              <div>
                <dt className="text-xs text-slate">Preferences</dt>
                <dd className="mt-0.5 text-sm capitalize text-charcoal">
                  {dietary.values.dietaryPreferences.join(', ')}
                </dd>
              </div>
            )}
            {dietary.values.allergens.length > 0 && (
              <div>
                <dt className="text-xs text-slate">Never include</dt>
                <dd className="mt-0.5 text-sm capitalize text-charcoal">
                  {dietary.values.allergens.join(', ')}
                </dd>
              </div>
            )}
          </dl>
        )}
      </Section>

      <Section icon={Wallet} title="Budget" editStep={STEP_INDEX.budget ?? 2} editLabel="Change">
        <dl className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-xs text-slate">Period</dt>
            <dd className="text-sm font-medium capitalize text-charcoal">
              {budget.values.planType}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-xs text-slate">Total</dt>
            <dd className="text-sm font-medium tabular-nums text-charcoal">
              {formatPKR(totalBudget)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-xs text-slate">Meals a day</dt>
            <dd className="text-sm font-medium capitalize text-charcoal">
              {selectedMealTypes.map((type) => type.label).join(', ') || '—'}
            </dd>
          </div>
        </dl>
      </Section>

      <Section
        icon={Bell}
        title="Reminders"
        editStep={STEP_INDEX.notifications ?? 3}
        editLabel="Change"
      >
        {enabledReminders.length === 0 ? (
          <p className="flex items-center gap-2 text-sm italic text-slate">
            <BellOff aria-hidden className="h-3.5 w-3.5" />
            All reminders off
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {enabledReminders.map((slot) => (
              <li
                key={slot.mealTypeId}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className="capitalize text-slate">{slot.label}</span>
                <span className="font-medium tabular-nums text-charcoal">
                  {formatTimeOfDay(slot.time)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
};
