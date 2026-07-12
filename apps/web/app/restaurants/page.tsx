'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, Star, X } from 'lucide-react';

import type { RestaurantSort } from '@repo/shared';
import { classifyBudgetFit } from '@repo/shared';

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
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useUser } from '@/hooks/use-user';
import { useRestaurants } from '@/hooks/use-restaurant';
import { FadeUp, Stagger, StaggerItem } from '@/components/motion';
import { RecommendRestaurantButton } from '@/components/recommend-restaurant-button';
import { motion } from 'motion/react';

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

type FitTone = 'green' | 'amber' | 'red';
const FIT_TONE: Record<FitTone, { dot: string; pill: string; label: string }> = {
  green: { dot: 'bg-green', pill: 'bg-green/10 text-dark-green', label: 'Fits budget' },
  amber: { dot: 'bg-[#f5a623]', pill: 'bg-[#fef6e6] text-[#8a5a12]', label: 'Tight' },
  red: { dot: 'bg-tomato', pill: 'bg-tomato/10 text-tomato', label: 'Over budget' },
};

function FitPill({ fit }: { fit: FitTone }) {
  const v = FIT_TONE[fit];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${v.pill}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${v.dot}`} />
      {v.label}
    </span>
  );
}

const labelClass = 'text-[10px] font-semibold uppercase tracking-[0.18em] text-slate/60';
const inputClass = 'bg-canvas border-sage text-charcoal';

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function parseNumberParam(raw: string | null, fallback: number, min: number, max: number): number {
  if (raw == null) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function RestaurantsPageInner() {
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

  const resolvedSort: RestaurantSort | undefined = useMemo(() => {
    if (sort === 'auto') return undefined;
    if (sort === 'budget-fit' && !hasActivePlan) return undefined;
    return sort;
  }, [sort, hasActivePlan]);

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

  const { data: result, isLoading, error, isFetching } = useRestaurants(query);
  const data = result?.data ?? [];
  const total = result?.meta.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;
  const hasPrev = page > 0;
  const hasNext = (page + 1) * PAGE_SIZE < total;

  // Active filter chips
  type ActiveChip = { key: string; label: string; clear: () => void };
  const activeChips: ActiveChip[] = [];
  if (urlQ) {
    activeChips.push({
      key: 'q',
      label: `"${urlQ}"`,
      clear: () => {
        setSearchInput('');
        updateParams({ q: null });
      },
    });
  }
  if (sort !== DEFAULT_SORT) {
    const sortLabels: Record<SortValue, string> = {
      auto: 'Default',
      distance: 'By distance',
      rating: 'By rating',
      'budget-fit': 'Best for budget',
    };
    activeChips.push({
      key: 'sort',
      label: sortLabels[sort] ?? String(sort),
      clear: () => updateParams({ sort: null }),
    });
  }
  if (hasLocation && maxDistanceKm !== DEFAULT_MAX_DISTANCE) {
    activeChips.push({
      key: 'distance',
      label: `≤ ${maxDistanceKm} km`,
      clear: () => updateParams({ maxDistanceKm: null }),
    });
  }
  if (minRating > 0) {
    activeChips.push({
      key: 'rating',
      label: `★ ${minRating}+`,
      clear: () => updateParams({ minRating: null }),
    });
  }

  const clearAll = () => {
    setSearchInput('');
    router.replace(pathname, { scroll: false });
  };

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <FadeUp>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold uppercase tracking-widest text-green">
              Nearby · Restaurants
            </div>
            <h1 className="font-display text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.05] tracking-tight text-charcoal">
              Restaurants
            </h1>
            <p className="max-w-[540px] text-[14px] text-slate">
              Places that deliver to you, ranked for your budget.
            </p>
          </div>
          <div className="flex items-center gap-4 sm:items-end">
            {hasActivePlan && avgPerMeal > 0 && (
              <div className="flex flex-col items-start gap-0.5 sm:items-end">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate/60">
                  Avg target / meal
                </p>
                <p className="font-display text-[22px] font-semibold tracking-tight text-charcoal">
                  ₨ {avgPerMeal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-[11px] text-slate">
                  ₨ {amountRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
                  remaining
                </p>
              </div>
            )}
            <div className="flex flex-col items-start gap-1.5 sm:items-end">
              <RecommendRestaurantButton />
              <Link
                href="/restaurants/recommendations"
                className="text-[12px] font-medium text-green underline-offset-2 hover:underline"
              >
                Your recommendations →
              </Link>
            </div>
          </div>
        </header>
      </FadeUp>

      <FadeUp delay={0.08}>
        <div className="overflow-hidden rounded-2xl border border-sage bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="search" className={labelClass}>
                  Search by name
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate/60" />
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
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      Default {hasLocation ? '(distance)' : '(name)'}
                    </SelectItem>
                    <SelectItem value="distance" disabled={!hasLocation}>
                      Distance
                    </SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    {hasActivePlan && <SelectItem value="budget-fit">Best for budget</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label className={labelClass}>
                  Max distance: <span className="text-green">{maxDistanceKm} km</span>
                </Label>
                <Slider
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
                        onClick={() => updateParams({ maxDistanceKm: String(km) })}
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          active
                            ? 'border-green bg-green/10 text-dark-green'
                            : 'border-sage bg-canvas text-slate hover:border-green/40'
                        }`}
                      >
                        {km}km
                      </button>
                    );
                  })}
                </div>
                {!hasLocation && (
                  <p className="text-[11px] text-slate/60">
                    Set your location in profile to enable distance.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label className={labelClass}>
                  Minimum rating:{' '}
                  <span className="text-green">{minRating === 0 ? 'Any' : `${minRating}+`}</span>
                </Label>
                <Slider
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
                        onClick={() =>
                          updateParams({ minRating: value === 0 ? null : String(value) })
                        }
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                          active
                            ? 'border-green bg-green/10 text-dark-green'
                            : 'border-sage bg-canvas text-slate hover:border-green/40'
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
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate/60">
            Active ·
          </span>
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              className="inline-flex items-center gap-1 rounded-full border border-sage bg-white px-2.5 py-1 text-[11px] font-medium text-charcoal transition-colors hover:border-tomato/40 hover:text-tomato"
              aria-label={`Remove ${chip.label}`}
            >
              {chip.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="ml-1 text-[11px] text-slate/60 underline-offset-2 hover:text-tomato hover:underline"
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
        <p className="rounded-xl border border-tomato/20 bg-tomato/[0.06] p-4 text-[13px] text-tomato">
          Could not load restaurants.
        </p>
      ) : data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sage bg-white p-8 text-center text-[13px] text-slate">
          {urlQ
            ? 'No restaurants match your search.'
            : activeChips.length > 0
              ? 'No restaurants match your filters — try clearing one.'
              : 'No restaurants found — try widening your radius.'}
        </div>
      ) : (
        <>
          <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
            {data.map((r, idx) => {
              const fit =
                hasActivePlan && r.minItemPrice != null && avgPerMeal > 0
                  ? classifyBudgetFit({
                      itemPrice: r.minItemPrice,
                      avgBudgetPerRemainingMeal: avgPerMeal,
                      amountRemaining,
                    })
                  : null;
              const code = String(idx + 1 + page * PAGE_SIZE).padStart(2, '0');
              const showAvg =
                r.avgItemPrice != null &&
                r.minItemPrice != null &&
                Math.round(r.avgItemPrice) !== Math.round(r.minItemPrice);
              const priceFreshness =
                r.minItemPrice != null ? pricesUpdatedAgoLabel(r.pricesUpdatedAt) : null;
              return (
                <StaggerItem key={r.id}>
                  <Link href={`/restaurants/${r.id}`} className="group block h-full">
                    <motion.div
                      whileHover={{ y: -3, boxShadow: '0 10px 24px rgba(0,0,0,0.07)' }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="flex h-full flex-col rounded-2xl border border-sage bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate/60">
                          {code}
                        </span>
                        {r.rating != null && (
                          <div className="flex shrink-0 items-baseline gap-1">
                            <Star
                              className="h-3.5 w-3.5 self-center text-[#f5a623]"
                              style={{ fill: '#f5a623' }}
                            />
                            <span className="text-[13px] font-semibold text-charcoal">
                              {r.rating.toFixed(1)}
                            </span>
                            {r.ratingCount > 0 && (
                              <span className="text-[11px] text-slate/60">
                                · {formatCount(r.ratingCount)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <h3 className="mt-2 truncate font-display text-lg font-semibold tracking-tight text-charcoal">
                        {r.name}
                      </h3>

                      <div className="mt-1 flex items-center gap-3 text-[12px] text-slate">
                        {r.distanceKm != null && <span>{r.distanceKm.toFixed(1)} km</span>}
                        {r.deliveryFee != null && <span>₨ {r.deliveryFee} fee</span>}
                      </div>

                      <div className="mt-auto flex flex-col gap-2 pt-4">
                        {fit && <FitPill fit={fit} />}
                        <div className="flex items-end justify-between gap-2">
                          {r.minItemPrice != null ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate/60">
                                From
                              </span>
                              <span className="font-display text-base font-semibold text-charcoal">
                                ₨ {r.minItemPrice.toLocaleString()}
                              </span>
                              {showAvg && (
                                <span className="text-[11px] text-slate/60">
                                  avg ₨ {Math.round(r.avgItemPrice as number).toLocaleString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate/60">no menu yet</span>
                          )}
                          {r.minimumOrder != null && (
                            <span className="text-[11px] text-slate">
                              min order ₨ {r.minimumOrder}
                            </span>
                          )}
                        </div>
                        {priceFreshness && (
                          <span className="text-[10px] text-slate/60">{priceFreshness}</span>
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
                onClick={() => updateParams({ page: String(page - 1) }, { resetPage: false })}
                disabled={!hasPrev || isFetching}
                className="inline-flex items-center rounded-lg border border-sage bg-white px-3 py-1.5 text-[12px] font-medium text-slate transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-40"
              >
                ← Prev
              </button>
              <p className="text-[11px] text-slate">
                Page {page + 1} of {totalPages} · {total} total
                {isFetching ? ' · loading…' : ''}
              </p>
              <button
                type="button"
                onClick={() => updateParams({ page: String(page + 1) }, { resetPage: false })}
                disabled={!hasNext || isFetching}
                className="inline-flex items-center rounded-lg border border-sage bg-white px-3 py-1.5 text-[12px] font-medium text-slate transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-40"
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
    <Suspense fallback={null}>
      <RestaurantsPageInner />
    </Suspense>
  );
}
