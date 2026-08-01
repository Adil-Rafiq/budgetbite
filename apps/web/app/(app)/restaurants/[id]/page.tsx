'use client';

import { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import { ExternalLink, Phone, Search, Star, Utensils } from 'lucide-react';

import {
  classifyBudgetFit,
  estimateMealCost,
  haversineKm,
  maxMenuPriceWithinBudget,
  UNCATEGORIZED,
} from '@repo/shared';
import type { BudgetFit, MenuItem, MenuSort } from '@repo/shared';

import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import {
  MENU_PAGE_SIZE,
  useRestaurant,
  useRestaurantMenu,
  useRestaurantMenuFacets,
} from '@/hooks/use-restaurant';
import { useUser } from '@/hooks/use-user';
import { pricesUpdatedAgoLabel } from '@/lib/date';
import { formatPKR } from '@/lib/currency';
import { formatCount } from '@/lib/format-count';
import { FOCUS_RING } from '@/lib/focus-ring';
import { humanizeName } from '@/lib/humanize-name';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { DataError } from '@/components/data-error';
import { RemainingAmount } from '@/components/budget/remaining-amount';
import { FoodPreferenceToggle } from '@/components/food-preference-toggle';
import { RestaurantImage } from '@/components/restaurant-image';

import { AddToPlanModal } from '../_components/add-to-plan-modal';
import { MenuItemSkeleton } from '../_components/menu-item-skeleton';
import { RestaurantHeaderSkeleton } from '../_components/restaurant-header-skeleton';
import { BudgetFitBadge } from '@/components/budget-fit-badge';

const MENU_CONTROLS_THRESHOLD = 6;
/** Typing shouldn't fire a request per keystroke now that search hits the API. */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Menu thumbnail with a real fallback.
 *
 * Image URLs come from the scraper and go stale on Foodpanda's CDN without
 * warning, so a bare image element renders the browser's broken-image glyph —
 * while a perfectly good `Utensils` placeholder sat two lines below, reachable
 * only when `imageUrl` was null. A dead URL is the same situation as no URL.
 */
function MenuItemImage({ src, alt }: { src: string | null | undefined; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div aria-hidden className="flex h-32 w-full items-center justify-center bg-canvas">
        <Utensils className="h-8 w-8 text-slate" />
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-32 w-full object-cover"
    />
  );
}

/**
 * Heading over the trailing block of items whose section the scrape never
 * learned. Only ever drawn when some *other* item does have one — a menu with
 * no sections at all gets no headings, not one called "More items".
 */
const UNCATEGORIZED_LABEL = 'More items';

function MenuItemCard({
  item,
  fit,
  delivered,
  onAddToPlan,
}: {
  item: MenuItem;
  fit: BudgetFit | null;
  delivered: number;
  /** Null when there's no active plan to add to. */
  onAddToPlan: (() => void) | null;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-sage bg-white shadow-sm">
      <MenuItemImage src={item.imageUrl} alt={item.name} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Menu names are long and compound ("Chicken Tikka Boneless Half
                  + 2 Naan + Drink"); `truncate` on a third-width card amputated
                  them with no title attribute and no way to read the rest. */}
              <p className="min-w-0 text-[14px] font-medium text-charcoal [overflow-wrap:anywhere] line-clamp-2">
                {item.name}
              </p>
              {fit && <BudgetFitBadge fit={fit} />}
            </div>
            {item.description && (
              <p className="mt-1 line-clamp-3 text-[12px] text-slate">{item.description}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <span className="whitespace-nowrap font-display text-base font-semibold tabular-nums text-charcoal">
              {formatPKR(item.price)}
            </span>
            {delivered !== item.price && (
              <span className="whitespace-nowrap text-[11px] tabular-nums text-slate">
                {formatPKR(delivered)} delivered
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <FoodPreferenceToggle targetType="menu_item" targetId={item.id} name={item.name} />
          {onAddToPlan && (
            <button
              type="button"
              onClick={onAddToPlan}
              className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-sage bg-white px-3 text-[12px] font-medium text-charcoal transition-colors hover:bg-canvas sm:min-h-10 ${FOCUS_RING}`}
            >
              Add to plan
              <span aria-hidden className="opacity-70">
                +
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface MenuGroup {
  key: string;
  /** Null renders the grid with no heading above it. */
  heading: string | null;
  items: MenuItem[];
}

/**
 * Split a page-accumulated item list into rendered sections.
 *
 * Works purely off "the category changed since the previous item", which is
 * sound only because the server returns `default` order as (category, name).
 * That is also why `withSections` is false for price sorts — there the same
 * category recurs every few cards and a heading per card is worse than none.
 */
function groupMenuItems(items: MenuItem[], withSections: boolean): MenuGroup[] {
  if (!withSections) return items.length ? [{ key: 'all', heading: null, items }] : [];

  const groups: MenuGroup[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    const heading = item.category ?? UNCATEGORIZED_LABEL;
    if (last && last.heading === heading) last.items.push(item);
    else groups.push({ key: heading, heading, items: [item] });
  }
  return groups;
}

function buildFoodpandaUrl(externalId: string, slug: string): string {
  // Scraped slugs sometimes carry the tracking query they were found with
  // ("jalal-sons-dha-iii?eo=large_order_swimlane"). Keep the path segment only,
  // or the constructed URL grows a second, malformed query string.
  const pathSegment = slug.split(/[?#]/)[0] ?? slug;
  return `https://www.foodpanda.pk/restaurant/${encodeURIComponent(externalId)}/${encodeURIComponent(
    pathSegment,
  )}`;
}

const labelClass = 'text-[10px] font-semibold uppercase tracking-[0.18em] text-slate';
const inputClass = 'bg-canvas border-sage-edge text-charcoal';
const ctaBase = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-4 text-[13px] font-semibold transition-colors ${FOCUS_RING}`;

/** Section chip. 44px tall on touch, tightened once a pointer is available. */
const chipClass = (active: boolean) =>
  `inline-flex min-h-11 items-center rounded-full border px-3.5 text-[12px] font-medium transition-colors sm:min-h-9 ${FOCUS_RING} ${
    active
      ? 'border-green-deep bg-green/10 text-green-deep'
      : 'border-sage bg-canvas text-charcoal hover:border-green'
  }`;

export default function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const restaurantQuery = useRestaurant(id);
  const facetsQuery = useRestaurantMenuFacets(id);
  const { data: activePlan } = useActiveBudgetPlan();
  const { data: user } = useUser();

  /** null = closed; `{ item: null }` = log a whole order rather than one dish. */
  const [logTarget, setLogTarget] = useState<{ item: MenuItem | null } | null>(null);
  const [menuSearch, setMenuSearch] = useState('');
  /** The debounced copy of `menuSearch` — this is the one the server sees. */
  const [searchTerm, setSearchTerm] = useState('');
  const [menuSort, setMenuSort] = useState<MenuSort>('default');
  const [hideOverBudget, setHideOverBudget] = useState(false);
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(menuSearch.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [menuSearch]);

  const r = restaurantQuery.data;
  const hasActivePlan = !!activePlan;
  const avgPerMeal = activePlan?.budgetState.avgBudgetPerRemainingMeal ?? 0;
  const amountRemaining = activePlan?.budgetState.amountRemaining ?? 0;
  const mealsRemaining = activePlan?.budgetState.mealsRemaining ?? 0;
  const foodpandaUrl = r?.externalId && r?.slug ? buildFoodpandaUrl(r.externalId, r.slug) : null;
  const orderUrl = foodpandaUrl ?? r?.orderUrl ?? null;

  const userLat = user?.profile?.latitude;
  const userLng = user?.profile?.longitude;
  const distanceKm =
    r && userLat != null && userLng != null && r.latitude != null && r.longitude != null
      ? haversineKm(userLat, userLng, r.latitude, r.longitude)
      : null;

  const canShowFit = hasActivePlan && avgPerMeal > 0;

  // What a dish here actually costs to receive, not what the menu prints.
  const deliveredCost = useMemo(
    () => (price: number) =>
      estimateMealCost({
        itemPrice: price,
        deliveryFee: r?.deliveryFee,
        minimumOrder: r?.minimumOrder,
      }),
    [r?.deliveryFee, r?.minimumOrder],
  );

  const fitOf = useMemo(
    () => (price: number) =>
      canShowFit
        ? classifyBudgetFit({
            itemPrice: deliveredCost(price),
            avgBudgetPerRemainingMeal: avgPerMeal,
            amountRemaining,
          })
        : null,
    [canShowFit, deliveredCost, avgPerMeal, amountRemaining],
  );

  /**
   * "Hide over-budget" as a price the server can filter on.
   *
   * `null` from the helper means no dish can qualify — the delivery fee and
   * minimum order already break the ceiling on their own — and a ceiling of 0
   * says exactly that to the API, since menu prices are positive. Collapsing it
   * to "no filter" would show a full menu under a pressed "Hide over-budget"
   * button, which is the opposite of what it claims.
   */
  const maxPrice = useMemo(() => {
    if (!hideOverBudget || !canShowFit) return undefined;
    return (
      maxMenuPriceWithinBudget({
        avgBudgetPerRemainingMeal: avgPerMeal,
        amountRemaining,
        deliveryFee: r?.deliveryFee,
        minimumOrder: r?.minimumOrder,
      }) ?? 0
    );
  }, [hideOverBudget, canShowFit, avgPerMeal, amountRemaining, r?.deliveryFee, r?.minimumOrder]);

  const menuFilters = useMemo(
    () => ({
      sort: menuSort,
      q: searchTerm || undefined,
      category: category ?? undefined,
      maxPrice,
    }),
    [menuSort, searchTerm, category, maxPrice],
  );

  const menuQuery = useRestaurantMenu(id, menuFilters);

  const facets = facetsQuery.data;
  const menuItems = useMemo(
    () => menuQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [menuQuery.data],
  );
  const matchCount = menuQuery.data?.pages[0]?.meta.total ?? 0;
  const freshness = facets?.pricesUpdatedAt ? pricesUpdatedAgoLabel(facets.pricesUpdatedAt) : null;

  /**
   * Section headings are only meaningful when the server is returning the
   * vendor's own order — a price sort interleaves categories, so a heading
   * would appear every second card. They are also pointless once a single
   * category is selected, and on a menu that has no sections at all.
   */
  const namedCategories = facets?.categories.filter((c) => c.category !== null) ?? [];
  const showSections = menuSort === 'default' && !category && namedCategories.length > 0;

  const menuGroups = useMemo(
    () => groupMenuItems(menuItems, showSections),
    [menuItems, showSections],
  );

  const showMenuControls = (facets?.count ?? 0) > MENU_CONTROLS_THRESHOLD;
  const filtersActive =
    searchTerm.length > 0 || menuSort !== 'default' || hideOverBudget || !!category;

  const clearFilters = () => {
    setMenuSearch('');
    setSearchTerm('');
    setMenuSort('default');
    setHideOverBudget(false);
    setCategory(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">
      <Link
        href="/restaurants"
        // The primary return path, sitting above a menu that can run to 365
        // items — it needs a thumb-sized target, not a 13px text baseline.
        className={`inline-flex min-h-11 w-fit items-center gap-1.5 rounded text-[13px] text-slate transition-colors hover:text-green-deep sm:min-h-9 ${FOCUS_RING}`}
      >
        ← Back to restaurants
      </Link>

      {restaurantQuery.isLoading ? (
        <RestaurantHeaderSkeleton />
      ) : restaurantQuery.error ? (
        <DataError message="Could not load restaurant." onRetry={() => restaurantQuery.refetch()} />
      ) : !r ? (
        <p className="text-[13px] text-slate">Restaurant not found.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-sage bg-white shadow-sm">
          {/* The vendor's own photo, full-bleed above the header. It draws
              nothing at all when there is none — a grey band the height of a
              banner would cost the same space and tell the reader less than
              the name it would be pushing down. */}
          <RestaurantImage
            src={r.imageUrl}
            fallback="nothing"
            className="h-36 w-full border-b border-sage sm:h-44"
          />
          <div className="flex flex-col gap-5 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 flex-col gap-2">
                <h1 className="font-display text-[clamp(24px,3vw,32px)] font-semibold leading-[1.1] tracking-tight text-charcoal [overflow-wrap:anywhere]">
                  {humanizeName(r.name)}
                </h1>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] tabular-nums text-slate">
                  {r.rating != null && (
                    <span
                      className="inline-flex items-center gap-1"
                      title={`${r.rating.toFixed(1)} out of 5 on Foodpanda`}
                    >
                      <Star aria-hidden className="h-3.5 w-3.5 fill-amber text-amber" />
                      <span className="font-semibold text-charcoal">{r.rating.toFixed(1)}</span>
                      {r.ratingCount > 0 && <span>({formatCount(r.ratingCount)})</span>}
                    </span>
                  )}
                  {distanceKm != null && <span>{distanceKm.toFixed(1)} km away</span>}
                  {r.deliveryFee != null && <span>delivery {formatPKR(r.deliveryFee)}</span>}
                  {r.minimumOrder != null && <span>min order {formatPKR(r.minimumOrder)}</span>}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <FoodPreferenceToggle
                  targetType="restaurant"
                  targetId={r.id}
                  name={r.name}
                  size="md"
                />
                {r.phone && (
                  <a
                    href={`tel:${r.phone}`}
                    className={`${ctaBase} border border-sage bg-white text-charcoal hover:bg-canvas`}
                  >
                    Call
                    <Phone aria-hidden className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* The product's defining constraint: it plans, the user orders,
                the user logs. Numbering is the information here — the second
                step is the one that keeps the budget honest, and it was
                previously stated on no pixel of this surface. */}
            <div className="flex flex-col gap-2 border-t border-sage pt-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {orderUrl && (
                  <a
                    href={orderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${ctaBase} bg-green-deep text-white hover:bg-green-deeper`}
                  >
                    1 · Order on {foodpandaUrl ? 'Foodpanda' : 'their site'}
                    <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setLogTarget({ item: null })}
                  disabled={!hasActivePlan}
                  title={hasActivePlan ? undefined : 'Start a budget plan to log spending'}
                  className={`${ctaBase} border border-sage bg-white text-charcoal hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  2 · Log what you spent
                </button>
              </div>
              <p className="max-w-[560px] text-[12px] leading-relaxed text-slate">
                BudgetBite doesn&apos;t place orders. Order on{' '}
                {foodpandaUrl ? 'Foodpanda' : 'their site'}, then come back and log the real total —
                that&apos;s the number your remaining budget and the rest of your plan are built
                from.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasActivePlan ? (
        // Sticky under the app header: every "Fits budget" / "Tight" label in
        // the menu below is measured against "Avg / meal", and on a 365-item
        // list that number used to scroll away within one flick — leaving the
        // labels as adjectives with nothing to compare them to. `min-w-0` on
        // the cells because a monthly plan's ₨ 120,000 overflows a 90px column
        // on a 320px phone otherwise.
        <div
          className={`sticky top-[57px] z-30 grid gap-3 rounded-2xl border border-sage bg-canvas/95 p-4 backdrop-blur ${
            avgPerMeal > 0 ? 'grid-cols-3' : 'grid-cols-2'
          }`}
        >
          {avgPerMeal > 0 && (
            <div className="flex min-w-0 flex-col">
              <span className={labelClass}>Avg / meal</span>
              <span className="truncate font-display text-base font-semibold tabular-nums tracking-tight text-charcoal">
                {formatPKR(avgPerMeal)}
              </span>
            </div>
          )}
          <div className="flex min-w-0 flex-col">
            <span className={labelClass}>Remaining</span>
            <RemainingAmount remaining={amountRemaining} size="md" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className={labelClass}>Meals left</span>
            <span className="truncate font-display text-base font-semibold tabular-nums tracking-tight text-charcoal">
              {mealsRemaining}
            </span>
          </div>
        </div>
      ) : (
        !restaurantQuery.isLoading && (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-sage bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-slate">
              Start a budget plan to see fit and log meals from here.
            </p>
            <Link
              href="/plans"
              className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-sage bg-white px-4 text-[13px] font-medium text-charcoal transition-colors hover:bg-canvas sm:min-h-10 ${FOCUS_RING}`}
            >
              Create a plan
              <span aria-hidden>→</span>
            </Link>
          </div>
        )
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-display text-[22px] font-semibold tracking-tight text-charcoal">
            Menu
          </h2>
          {facets && facets.count > 0 && (
            // Filtering 365 items down to 3 changed this number silently; a
            // screen-reader user had to tab into the grid to learn anything
            // had happened. The totals come from the facets endpoint, so the
            // "of 365" stays put while the reader narrows the list.
            <span role="status" aria-live="polite" className="text-[12px] tabular-nums text-slate">
              {filtersActive
                ? `${matchCount} of ${facets.count} items`
                : `${facets.count} item${facets.count === 1 ? '' : 's'}`}
              {facets.minPrice != null && facets.maxPrice != null && (
                <>
                  {' '}
                  · {formatPKR(facets.minPrice)} – {formatPKR(facets.maxPrice)}
                </>
              )}
              {facets.avgPrice != null && <> · avg {formatPKR(facets.avgPrice)}</>}
              {freshness ? ` · ${freshness}` : ''}
              {/* Filtering is a round trip now. Saying so beats a list that
                  sits still for 300ms and then silently changes underneath. */}
              {menuQuery.isFetching && !menuQuery.isFetchingNextPage && ' · updating…'}
            </span>
          )}
        </div>

        {hasActivePlan && !canShowFit && (
          <p className="text-[12px] text-slate">
            No meals left in this plan, so budget fit isn&apos;t shown. Prices below are menu prices
            {r?.deliveryFee ? ` and exclude the ${formatPKR(r.deliveryFee)} delivery fee` : ''}.
          </p>
        )}

        {showMenuControls && (
          <div className="overflow-hidden rounded-2xl border border-sage bg-white shadow-sm">
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
              <div className="flex flex-col gap-2">
                <Label htmlFor="menu-search" className={labelClass}>
                  Search menu
                </Label>
                <div className="relative">
                  <Search
                    aria-hidden
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                  />
                  <Input
                    id="menu-search"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    placeholder="e.g. burger"
                    className={`pl-9 ${inputClass}`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="menu-sort" className={labelClass}>
                  Sort
                </Label>
                <Select value={menuSort} onValueChange={(v) => setMenuSort(v as MenuSort)}>
                  <SelectTrigger id="menu-sort" className={`w-full ${inputClass}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* "Best fit first" used to be a fourth option. It ranked by
                        budget fit, which is a monotonic function of price — so
                        it produced the same order as "Price: low → high", only
                        coarser. One of the two had to go, and the one that
                        still sorts within a fit band is the one that stayed. */}
                    <SelectItem value="default">
                      {showSections || namedCategories.length > 0 ? 'Menu order' : 'Default'}
                    </SelectItem>
                    <SelectItem value="price-asc">Price: low → high</SelectItem>
                    <SelectItem value="price-desc">Price: high → low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {canShowFit && (
                <button
                  type="button"
                  onClick={() => setHideOverBudget((v) => !v)}
                  aria-pressed={hideOverBudget}
                  className={`min-h-11 rounded-full border px-4 text-[12px] font-medium transition-colors sm:min-h-10 ${FOCUS_RING} ${
                    hideOverBudget
                      ? 'border-green-deep bg-green/10 text-green-deep'
                      : 'border-sage bg-canvas text-slate hover:border-green'
                  }`}
                >
                  {hideOverBudget ? '✓ ' : ''}Hide over-budget
                </button>
              )}
            </div>

            {/* Sections as filters. On a 365-item menu this is the difference
                between fifteen taps of "Show more" and one tap to the eleven
                things the vendor calls Desserts — and it costs one request for
                eleven rows instead of paging through the other 354. */}
            {facets && facets.categories.length > 1 && (
              <div className="border-t border-sage px-4 py-3">
                <div
                  role="group"
                  aria-label="Filter by menu section"
                  className="flex flex-wrap gap-2"
                >
                  <button
                    type="button"
                    onClick={() => setCategory(null)}
                    aria-pressed={category === null}
                    className={chipClass(category === null)}
                  >
                    All
                    <span className="ml-1.5 tabular-nums opacity-70">{facets.count}</span>
                  </button>
                  {facets.categories.map((c) => {
                    // A null category is a real group of items but not a real
                    // name, so it travels as a sentinel and is labelled rather
                    // than printed.
                    const value = c.category ?? UNCATEGORIZED;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCategory(category === value ? null : value)}
                        aria-pressed={category === value}
                        className={chipClass(category === value)}
                      >
                        {c.category ?? UNCATEGORIZED_LABEL}
                        <span className="ml-1.5 tabular-nums opacity-70">{c.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {menuQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <MenuItemSkeleton key={i} />
            ))}
          </div>
        ) : menuQuery.error ? (
          <DataError message="Could not load menu." onRetry={() => menuQuery.refetch()} />
        ) : facets && facets.count === 0 ? (
          <div className="rounded-2xl border border-dashed border-sage bg-white p-6 text-center text-[13px] text-slate">
            No menu items yet.
          </div>
        ) : matchCount === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-sage bg-white p-6 text-center">
            <p className="text-[13px] text-slate">
              {hideOverBudget && maxPrice === 0
                ? // The honest reason, rather than a shrug: with this vendor's
                  // fee and minimum order, no dish can land inside the budget.
                  'Nothing here comes in under budget once delivery and the minimum order are counted.'
                : 'No items match your filters.'}
            </p>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className={`inline-flex min-h-11 items-center rounded-lg border border-sage bg-white px-4 text-[13px] font-medium text-charcoal transition-colors hover:bg-canvas sm:min-h-10 ${FOCUS_RING}`}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {menuGroups.map((group) => (
              <div key={group.key} className="flex flex-col gap-3">
                {group.heading && (
                  // Sections build up across pages rather than being computed
                  // from a complete menu: the server returns items in category
                  // order, so a heading is simply where the category changed.
                  <h3 className="pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">
                    {group.heading}
                  </h3>
                )}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      fit={fitOf(item.price)}
                      delivered={deliveredCost(item.price)}
                      onAddToPlan={hasActivePlan ? () => setLogTarget({ item }) : null}
                    />
                  ))}
                </div>
              </div>
            ))}

            {menuQuery.hasNextPage && (
              <div className="flex flex-col items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => menuQuery.fetchNextPage()}
                  disabled={menuQuery.isFetchingNextPage}
                  className={`inline-flex min-h-11 items-center rounded-lg border border-sage bg-white px-5 text-[13px] font-medium text-charcoal transition-colors hover:bg-canvas disabled:cursor-wait disabled:opacity-60 ${FOCUS_RING}`}
                >
                  {menuQuery.isFetchingNextPage
                    ? 'Loading…'
                    : `Show ${Math.min(MENU_PAGE_SIZE, matchCount - menuItems.length)} more`}
                </button>
                <p aria-live="polite" className="text-[11px] tabular-nums text-slate">
                  Showing {menuItems.length} of {matchCount}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {logTarget && r && (
        <AddToPlanModal
          open
          onOpenChange={(open) => !open && setLogTarget(null)}
          restaurantId={r.id}
          restaurantName={r.name}
          menuItem={logTarget.item}
          deliveryFee={r.deliveryFee}
          minimumOrder={r.minimumOrder}
        />
      )}
    </div>
  );
}
