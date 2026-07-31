'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, Star, X } from 'lucide-react';

import type { RestaurantSort } from '@repo/shared';
import { classifyBudgetFit, typicalMealCost } from '@repo/shared';

import { BudgetFitBadge } from '@/components/budget-fit-badge';
import { RemainingAmount } from '@/components/budget/remaining-amount';
import { DataError } from '@/components/data-error';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

import { pricesUpdatedAgoLabel } from '@/lib/date';
import { formatPKR } from '@/lib/currency';
import { formatCount } from '@/lib/format-count';
import { FOCUS_RING } from '@/lib/focus-ring';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useUser } from '@/hooks/use-user';
import { useRestaurants } from '@/hooks/use-restaurant';
import { FadeUp, Stagger, StaggerItem } from '@/components/motion';
import { RecommendRestaurantButton } from '@/components/recommend-restaurant-button';
import { humanizeName } from '@/lib/humanize-name';
import { motion, useReducedMotion } from 'motion/react';

import { RestaurantCardSkeleton } from './_components/restaurant-card-skeleton';

const PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 300;

const DEFAULT_MAX_DISTANCE = 10;
const DEFAULT_MIN_RATING = 0;
const DEFAULT_SORT = 'auto' as const;

const DISTANCE_PRESETS = [1, 3, 5, 10, 30] as const;
const RATING_PRESETS = [
  { value: 0, label: 'Any' },
  { value: 3.5, label: '3.5+' },
  { value: 4, label: '4+' },
  { value: 4.5, label: '4.5+' },
] as const;

type SortValue = RestaurantSort | 'auto';

/** The ordering in force, as the user is told about it. */
type Ordering = 'budget' | 'distance' | 'rating' | 'name';

const labelClass = 'text-[10px] font-semibold uppercase tracking-[0.18em] text-slate';
const inputClass = 'bg-canvas border-sage-edge text-charcoal';

/** Filter chips sit in a wrapping row: thumb-sized on phones, dense on desktop. */
const presetClass = `inline-flex min-h-11 items-center rounded-full border px-3 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9 ${FOCUS_RING}`;

function parseNumberParam(raw: string | null, fallback: number, min: number, max: number): number {
  if (raw == null) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function RestaurantsPageInner() {
  const reduceMotion = useReducedMotion();
  const { data: user } = useUser();
  const userLat = user?.profile?.latitude;
  const userLng = user?.profile?.longitude;

  const { data: activePlan } = useActiveBudgetPlan();
  const hasActivePlan = !!activePlan;
  const avgPerMeal = activePlan?.budgetState.avgBudgetPerRemainingMeal ?? 0;
  const amountRemaining = activePlan?.budgetState.amountRemaining ?? 0;

  // ─── URL state ─────────────────────────────────────────────────────────────
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlQ = searchParams.get('q') ?? '';
  const sort = (searchParams.get('sort') as SortValue | null) ?? DEFAULT_SORT;
  const maxDistanceKm = parseNumberParam(
    searchParams.get('maxDistanceKm'),
    DEFAULT_MAX_DISTANCE,
    1,
    30,
  );
  const minRating = parseNumberParam(searchParams.get('minRating'), DEFAULT_MIN_RATING, 0, 5);
  const page = Math.max(0, Number(searchParams.get('page') ?? '0') || 0);

  const updateParams = useCallback(
    (updates: Record<string, string | null>, opts: { resetPage?: boolean } = {}) => {
      const { resetPage = true } = opts;
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v == null || v === '') params.delete(k);
        else params.set(k, v);
      }
      if (resetPage && !('page' in updates)) params.delete('page');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  // Search input — local for instant typing, debounced into the URL.
  const [searchInput, setSearchInput] = useState(urlQ);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput.trim() !== urlQ) {
        updateParams({ q: searchInput.trim() || null });
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput, urlQ, updateParams]);

  // External URL changes (back/forward, "clear all"): re-sync input.
  useEffect(() => {
    setSearchInput((prev) => (prev.trim() === urlQ ? prev : urlQ));
  }, [urlQ]);

  const hasLocation = userLat != null && userLng != null;
  const canRankByBudget = hasActivePlan && avgPerMeal > 0;

  /**
   * What "Recommended" actually resolves to.
   *
   * This page used to promise "ranked for your budget" in the subtitle while
   * `auto` fell through to the repository's distance ordering: the copy said
   * money, the ORDER BY said proximity, and on first load the cheapest place a
   * user could afford could sit on page 2. Budget adherence is the product, so
   * when the per-meal target is known we sort by it and distance is the
   * fallback. The subtitle and the select label are both derived from this one
   * value, so the claim and the query cannot drift apart again.
   */
  const autoOrdering: Ordering = canRankByBudget
    ? 'budget'
    : hasLocation
      ? 'distance'
      : 'name';

  const resolvedSort: RestaurantSort | undefined = useMemo(() => {
    if (sort === 'auto') return canRankByBudget ? 'budget-fit' : undefined;
    if (sort === 'budget-fit' && !canRankByBudget) return undefined;
    if (sort === 'distance' && !hasLocation) return undefined;
    return sort;
  }, [sort, canRankByBudget, hasLocation]);

  /** The ordering actually in force, whatever the user picked. */
  const ordering: Ordering =
    sort === 'auto'
      ? autoOrdering
      : resolvedSort === 'budget-fit'
        ? 'budget'
        : resolvedSort === 'distance'
          ? 'distance'
          : resolvedSort === 'rating'
            ? 'rating'
            : 'name';

  const query = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      userLat: userLat ?? undefined,
      userLng: userLng ?? undefined,
      maxDistanceKm: hasLocation ? maxDistanceKm : undefined,
      minRating: minRating > 0 ? minRating : undefined,
      q: urlQ || undefined,
      sort: resolvedSort,
    }),
    [userLat, userLng, hasLocation, maxDistanceKm, minRating, urlQ, resolvedSort, page],
  );

  const { data: result, isLoading, error, isFetching, refetch } = useRestaurants(query);
  const data = result?.data ?? [];
  const total = result?.meta.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;
  const hasPrev = page > 0;
  const hasNext = (page + 1) * PAGE_SIZE < total;

  // Active filter chips
  type ActiveChip = { key: string; label: string; a11yLabel: string; clear: () => void };
  const activeChips: ActiveChip[] = [];
  if (urlQ) {
    activeChips.push({
      key: 'q',
      label: `"${urlQ}"`,
      a11yLabel: `Clear search for ${urlQ}`,
      clear: () => {
        setSearchInput('');
        updateParams({ q: null });
      },
    });
  }
  if (sort !== DEFAULT_SORT) {
    const sortLabels: Record<SortValue, string> = {
      auto: 'Recommended',
      distance: 'By distance',
      rating: 'By rating',
      'budget-fit': 'Best for budget',
    };
    activeChips.push({
      key: 'sort',
      label: sortLabels[sort] ?? String(sort),
      a11yLabel: 'Clear sort',
      clear: () => updateParams({ sort: null }),
    });
  }
  if (hasLocation && maxDistanceKm !== DEFAULT_MAX_DISTANCE) {
    activeChips.push({
      key: 'distance',
      label: `≤ ${maxDistanceKm} km`,
      a11yLabel: `Clear distance filter of ${maxDistanceKm} kilometres or less`,
      clear: () => updateParams({ maxDistanceKm: null }),
    });
  }
  if (minRating > 0) {
    activeChips.push({
      key: 'rating',
      label: `★ ${minRating}+`,
      a11yLabel: `Clear minimum rating of ${minRating} and above`,
      clear: () => updateParams({ minRating: null }),
    });
  }

  const clearAll = () => {
    setSearchInput('');
    router.replace(pathname, { scroll: false });
  };

  const goToPage = (next: number) => {
    updateParams({ page: next > 0 ? String(next) : null }, { resetPage: false });
    // Paging without this leaves the reader parked at the bottom of the new
    // page, facing the pagination controls with 24 unseen cards above them.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const emptyMessage = page > 0
    ? 'Nothing on this page.'
    : urlQ
      ? `No restaurants match “${urlQ}”.`
      : activeChips.length > 0
        ? 'No restaurants match your filters.'
        : hasLocation
          ? `No restaurants within ${maxDistanceKm} km of you.`
          : 'No restaurants yet.';

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <FadeUp>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.05] tracking-tight text-charcoal">
              Restaurants
            </h1>
            <p className="max-w-[540px] text-[14px] text-slate">
              {ordering === 'budget'
                ? `Places that deliver to you, the ones that fit ${formatPKR(avgPerMeal)} a meal first.`
                : ordering === 'distance'
                  ? hasActivePlan
                    ? 'Places that deliver to you, nearest first.'
                    : 'Places that deliver to you, nearest first. Start a plan to rank them by what you can afford.'
                  : ordering === 'rating'
                    ? 'Places that deliver to you, best rated first.'
                    : 'Every restaurant we have, A–Z. Set your location to see what’s near you.'}
            </p>
          </div>
          <div className="flex items-center gap-4 sm:items-end">
            {hasActivePlan && (
              <div className="flex flex-col items-start gap-0.5 sm:items-end">
                {avgPerMeal > 0 && (
                  <>
                    <p className={labelClass}>Avg target / meal</p>
                    <p className="font-display text-[22px] font-semibold tabular-nums tracking-tight text-charcoal">
                      {formatPKR(avgPerMeal)}
                    </p>
                  </>
                )}
                <RemainingAmount remaining={amountRemaining} size={avgPerMeal > 0 ? 'sm' : 'md'} />
              </div>
            )}
            <div className="flex flex-col items-start gap-1.5 sm:items-end">
              <RecommendRestaurantButton />
              <Link
                href="/restaurants/recommendations"
                className={`rounded text-[12px] font-medium text-green-deep underline-offset-2 hover:underline ${FOCUS_RING}`}
              >
                Your recommendations →
              </Link>
            </div>
          </div>
        </header>
      </FadeUp>

      {!hasActivePlan && (
        <FadeUp delay={0.04}>
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-sage bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-slate">
              Start a budget plan to see which of these fit what you have left.
            </p>
            <Link
              href="/plans"
              className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-sage bg-white px-4 text-[13px] font-medium text-charcoal transition-colors hover:bg-canvas sm:min-h-10 ${FOCUS_RING}`}
            >
              Create a plan
              <span aria-hidden>→</span>
            </Link>
          </div>
        </FadeUp>
      )}

      <FadeUp delay={0.08}>
        <div className="overflow-hidden rounded-2xl border border-sage bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="search" className={labelClass}>
                  Search by name
                </Label>
                <div className="relative">
                  <Search
                    aria-hidden
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                  />
                  <Input
                    id="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="e.g. KFC"
                    className={`pl-9 ${inputClass}`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="sort" className={labelClass}>
                  Sort
                </Label>
                <Select
                  value={sort}
                  onValueChange={(v) => updateParams({ sort: v === DEFAULT_SORT ? null : v })}
                >
                  <SelectTrigger id="sort" className={`w-full ${inputClass}`}>
                    <SelectValue placeholder="Recommended" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      Recommended{' '}
                      {autoOrdering === 'budget'
                        ? '(best for budget)'
                        : autoOrdering === 'distance'
                          ? '(nearest first)'
                          : '(A–Z)'}
                    </SelectItem>
                    <SelectItem value="distance" disabled={!hasLocation}>
                      Distance {hasLocation ? '' : '— needs your location'}
                    </SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="budget-fit" disabled={!canRankByBudget}>
                      Best for budget {canRankByBudget ? '' : '— needs an active plan'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label id="distance-label" className={labelClass}>
                  Max distance: <span className="text-green-deep">{maxDistanceKm} km</span>
                </Label>
                <Slider
                  aria-labelledby="distance-label"
                  aria-describedby={hasLocation ? undefined : 'distance-hint'}
                  value={[maxDistanceKm]}
                  onValueChange={(vals) =>
                    updateParams({ maxDistanceKm: String(vals[0] ?? DEFAULT_MAX_DISTANCE) })
                  }
                  min={1}
                  max={30}
                  step={1}
                  disabled={!hasLocation}
                />
                <div className="flex flex-wrap gap-1.5">
                  {DISTANCE_PRESETS.map((km) => {
                    const active = maxDistanceKm === km;
                    return (
                      <button
                        key={km}
                        type="button"
                        disabled={!hasLocation}
                        aria-pressed={active}
                        onClick={() => updateParams({ maxDistanceKm: String(km) })}
                        className={`${presetClass} ${
                          active
                            ? 'border-green-deep bg-green/10 text-green-deep'
                            : 'border-sage bg-canvas text-slate hover:border-green'
                        }`}
                      >
                        {km} km
                      </button>
                    );
                  })}
                </div>
                {!hasLocation && (
                  <p id="distance-hint" className="text-[12px] text-slate">
                    <Link
                      href="/profile"
                      className={`rounded font-medium text-green-deep underline underline-offset-2 ${FOCUS_RING}`}
                    >
                      Set your location
                    </Link>{' '}
                    to filter and sort by distance.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label id="rating-label" className={labelClass}>
                  Minimum rating:{' '}
                  <span className="text-green-deep">
                    {minRating === 0 ? 'Any' : `${minRating}+`}
                  </span>
                </Label>
                <Slider
                  aria-labelledby="rating-label"
                  value={[minRating]}
                  onValueChange={(vals) =>
                    updateParams({
                      minRating:
                        (vals[0] ?? DEFAULT_MIN_RATING) === DEFAULT_MIN_RATING
                          ? null
                          : String(vals[0]),
                    })
                  }
                  min={0}
                  max={5}
                  step={0.5}
                />
                <div className="flex flex-wrap gap-1.5">
                  {RATING_PRESETS.map(({ value, label }) => {
                    const active = minRating === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          updateParams({ minRating: value === 0 ? null : String(value) })
                        }
                        className={`${presetClass} ${
                          active
                            ? 'border-green-deep bg-green/10 text-green-deep'
                            : 'border-sage bg-canvas text-slate hover:border-green'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeUp>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate">
            Active ·
          </span>
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border border-sage bg-white px-3 text-[12px] font-medium text-charcoal transition-colors hover:border-tomato hover:text-tomato-ink sm:min-h-9 ${FOCUS_RING}`}
              aria-label={chip.a11yLabel}
            >
              {chip.label}
              <X aria-hidden className="h-3.5 w-3.5" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className={`ml-1 inline-flex min-h-11 items-center rounded px-1 text-[12px] text-slate underline-offset-2 hover:text-tomato-ink hover:underline sm:min-h-9 ${FOCUS_RING}`}
          >
            Clear all
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <DataError message="Could not load restaurants." onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-sage bg-white p-8 text-center">
          <p className="text-[13px] text-slate">{emptyMessage}</p>
          {page > 0 ? (
            <button
              type="button"
              onClick={() => goToPage(0)}
              className={`inline-flex min-h-11 items-center rounded-lg border border-sage bg-white px-4 text-[13px] font-medium text-charcoal transition-colors hover:bg-canvas sm:min-h-10 ${FOCUS_RING}`}
            >
              Back to the first page
            </button>
          ) : activeChips.length > 0 ? (
            <button
              type="button"
              onClick={clearAll}
              className={`inline-flex min-h-11 items-center rounded-lg border border-sage bg-white px-4 text-[13px] font-medium text-charcoal transition-colors hover:bg-canvas sm:min-h-10 ${FOCUS_RING}`}
            >
              Clear all filters
            </button>
          ) : hasLocation && maxDistanceKm < 30 ? (
            <button
              type="button"
              onClick={() => updateParams({ maxDistanceKm: '30' })}
              className={`inline-flex min-h-11 items-center rounded-lg border border-sage bg-white px-4 text-[13px] font-medium text-charcoal transition-colors hover:bg-canvas sm:min-h-10 ${FOCUS_RING}`}
            >
              Widen to 30 km
            </button>
          ) : null}
        </div>
      ) : (
        <>
          {/* The count and the explanation of "Typical meal" both used to sit
              below the grid — the tally inside the pagination block, so it only
              existed past 24 results, and the footnote after every card it was
              written to inform. Filtering 44 down to 3 showed no number and
              announced nothing. Both belong above the results they describe. */}
          <div className="flex flex-col gap-2">
            <p role="status" aria-live="polite" className="text-[12px] tabular-nums text-slate">
              {total} restaurant{total === 1 ? '' : 's'}
              {activeChips.length > 0 ? ' match your filters' : ''}
              {totalPages > 1 ? ` · page ${page + 1} of ${totalPages}` : ''}
              {isFetching ? ' · updating…' : ''}
            </p>
            <p className="max-w-[640px] text-[12px] leading-relaxed text-slate">
              &ldquo;Typical meal&rdquo; is the average dish here plus delivery, raised to the
              minimum order where there is one. Prices are estimates from the last menu update, not
              quotes — BudgetBite never orders for you, so what you log after ordering is what
              counts.
            </p>
          </div>

          <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" stagger={0.02}>
            {data.map((r) => {
              // Judge the restaurant on what a meal here actually costs to
              // receive — the average dish, floored by the minimum order, plus
              // delivery — not on the cheapest thing on the menu.
              const typicalCost = typicalMealCost({
                avgItemPrice: r.avgItemPrice,
                minItemPrice: r.minItemPrice,
                deliveryFee: r.deliveryFee,
                minimumOrder: r.minimumOrder,
              });
              const fit =
                hasActivePlan && typicalCost != null && avgPerMeal > 0
                  ? classifyBudgetFit({
                      itemPrice: typicalCost,
                      avgBudgetPerRemainingMeal: avgPerMeal,
                      amountRemaining,
                    })
                  : null;
              const priceFreshness =
                typicalCost != null ? pricesUpdatedAgoLabel(r.pricesUpdatedAt) : null;
              // Deliberately not "from ₨24": the cheapest item on the menu is
              // the anchor `typicalMealCost` exists to remove, and printing it
              // under the typical figure re-plants it two lines lower.
              const basis = r.deliveryFee ? `incl. ${formatPKR(r.deliveryFee)} delivery` : null;
              return (
                <StaggerItem key={r.id}>
                  <Link
                    href={`/restaurants/${r.id}`}
                    className={`group block h-full rounded-2xl ${FOCUS_RING}`}
                  >
                    <motion.div
                      whileHover={
                        reduceMotion ? undefined : { y: -3, boxShadow: '0 10px 24px rgba(0,0,0,0.07)' }
                      }
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="flex h-full flex-col rounded-2xl border border-sage bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="min-w-0 flex-1 font-display text-lg font-semibold leading-snug tracking-tight text-charcoal [overflow-wrap:anywhere] line-clamp-2">
                          {humanizeName(r.name)}
                        </h3>
                        {r.rating != null && (
                          <span
                            className="flex shrink-0 items-baseline gap-1"
                            title={`${r.rating.toFixed(1)} out of 5 on Foodpanda`}
                          >
                            <Star
                              aria-hidden
                              className="h-3.5 w-3.5 self-center fill-amber text-amber"
                            />
                            <span className="text-[13px] font-semibold tabular-nums text-charcoal">
                              {r.rating.toFixed(1)}
                            </span>
                            {r.ratingCount > 0 && (
                              <span className="text-[11px] tabular-nums text-slate">
                                · {formatCount(r.ratingCount)}
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex items-center gap-3 text-[12px] tabular-nums text-slate">
                        {r.distanceKm != null && <span>{r.distanceKm.toFixed(1)} km</span>}
                        {r.deliveryFee != null && <span>{formatPKR(r.deliveryFee)} delivery</span>}
                      </div>

                      {/* The verdict sits on the same line as the number it is
                          a verdict about, both at the card's largest weight.
                          It used to be a 10px pill stacked above a 16px figure,
                          below the name, the rating, the distance and the fee —
                          the smallest element on a card in a product whose
                          entire job is answering "can I afford this?". */}
                      <div className="mt-auto flex flex-col gap-1.5 pt-4">
                        <div className="flex items-end justify-between gap-2">
                          {typicalCost != null ? (
                            <div className="flex min-w-0 flex-col gap-0.5">
                              <span className={labelClass}>Typical meal</span>
                              <span className="font-display text-xl font-semibold tabular-nums leading-none text-charcoal">
                                {formatPKR(typicalCost)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[12px] text-slate">no menu yet</span>
                          )}
                          {fit && (
                            <span className="shrink-0">
                              <BudgetFitBadge fit={fit} showDot />
                            </span>
                          )}
                        </div>
                        {(basis || r.minimumOrder != null) && (
                          <div className="flex flex-wrap items-center gap-x-2 text-[11px] tabular-nums text-slate">
                            {basis && <span>{basis}</span>}
                            {r.minimumOrder != null && (
                              <span>min order {formatPKR(r.minimumOrder)}</span>
                            )}
                          </div>
                        )}
                        {priceFreshness && (
                          <span className="text-[11px] text-slate">{priceFreshness}</span>
                        )}
                      </div>
                    </motion.div>
                  </Link>
                </StaggerItem>
              );
            })}
          </Stagger>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={!hasPrev || isFetching}
                className={`inline-flex min-h-11 items-center rounded-lg border border-sage bg-white px-4 text-[13px] font-medium text-charcoal transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-50 sm:min-h-10 ${FOCUS_RING}`}
              >
                ← Prev
              </button>
              <p className="text-[12px] tabular-nums text-slate">
                Page {page + 1} of {totalPages}
              </p>
              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={!hasNext || isFetching}
                className={`inline-flex min-h-11 items-center rounded-lg border border-sage bg-white px-4 text-[13px] font-medium text-charcoal transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-50 sm:min-h-10 ${FOCUS_RING}`}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function RestaurantsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto grid w-full max-w-[1180px] gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <RestaurantsPageInner />
    </Suspense>
  );
}
