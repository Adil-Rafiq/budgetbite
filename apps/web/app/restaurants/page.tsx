'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Star } from 'lucide-react';

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

import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useUser } from '@/hooks/use-user';
import { useRestaurants } from '@/hooks/use-restaurant';
import { FadeUp, Stagger, StaggerItem } from '@/components/motion';
import { Pill } from '@/components/ui/pill';
import { motion } from 'motion/react';

import { RestaurantCardSkeleton } from './_components/restaurant-card-skeleton';

// ─── Wispr palette ───────────────────────────────────────────────────────────

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const PULSE = '#7f1c34';
const AMBER = '#b8741a';
const WHITE = '#ffffff';
const MUTED = '#71716a';
const SOFT = '#a6a691';

const PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 300;

const FIT_TINT: Record<'green' | 'amber' | 'red', { tint: string; label: string }> = {
  green: { tint: FATHOM, label: 'Fits budget' },
  amber: { tint: AMBER, label: 'Tight' },
  red: { tint: PULSE, label: 'Over budget' },
};

function FitDot({ fit }: { fit: 'green' | 'amber' | 'red' }) {
  const v = FIT_TINT[fit];
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ background: v.tint }}
      aria-label={v.label}
      title={v.label}
    />
  );
}

export default function RestaurantsPage() {
  const { data: user } = useUser();
  const userLat = user?.profile?.latitude;
  const userLng = user?.profile?.longitude;

  const { data: activePlan } = useActiveBudgetPlan();
  const hasActivePlan = !!activePlan;
  const avgPerMeal = activePlan?.budgetState.avgBudgetPerRemainingMeal ?? 0;
  const amountRemaining = activePlan?.budgetState.amountRemaining ?? 0;

  const [maxDistanceKm, setMaxDistanceKm] = useState(10);
  const [minRating, setMinRating] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<RestaurantSort | 'auto'>('auto');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, sort, maxDistanceKm, minRating, userLat, userLng]);

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
      maxDistanceKm: userLat != null && userLng != null ? maxDistanceKm : undefined,
      minRating: minRating > 0 ? minRating : undefined,
      q: debouncedSearch || undefined,
      sort: resolvedSort,
    }),
    [userLat, userLng, maxDistanceKm, minRating, debouncedSearch, resolvedSort, page],
  );

  const { data = [], isLoading, error, isFetching } = useRestaurants(query);

  const hasLocation = userLat != null && userLng != null;
  const isLastPage = data.length < PAGE_SIZE;

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    color: SOFT,
    letterSpacing: '0.18em',
  };
  const inputStyle = { background: LUMEN, borderColor: LUMEN_DK, color: VAST };

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <FadeUp>
      <header className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div
            className="text-[10px] uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: FATHOM, letterSpacing: '0.22em' }}
          >
            nearby · /restaurants
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 3.6vw, 40px)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              color: VAST,
            }}
          >
            Restaurants.
          </h1>
          <p className="text-[14px]" style={{ color: MUTED, maxWidth: 540 }}>
            Places that deliver to you, ranked for your budget.
          </p>
        </div>
        {hasActivePlan && avgPerMeal > 0 && (
          <div
            className="hidden flex-col items-end gap-0.5 sm:flex"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <p className="text-[11px] uppercase" style={{ color: SOFT, letterSpacing: '0.18em' }}>
              avg target / meal
            </p>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 600,
                color: VAST,
                letterSpacing: '-0.02em',
              }}
            >
              ₨ {avgPerMeal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[11px]" style={{ color: MUTED }}>
              ₨ {amountRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} remaining
            </p>
          </div>
        )}
      </header>
      </FadeUp>

      {/* Filters */}
      <FadeUp delay={0.08}>
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          background: WHITE,
          border: `1px solid ${LUMEN_DK}`,
          boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
        }}
      >
        <div className="flex flex-col gap-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="search" className="text-[10px] uppercase" style={labelStyle}>
                Search by name
              </Label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: SOFT }}
                />
                <Input
                  id="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="e.g. Nihari"
                  className="pl-9"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sort" className="text-[10px] uppercase" style={labelStyle}>
                Sort
              </Label>
              <Select value={sort} onValueChange={(v) => setSort(v as RestaurantSort | 'auto')}>
                <SelectTrigger id="sort" className="w-full" style={inputStyle}>
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
              <Label className="text-[10px] uppercase" style={labelStyle}>
                Max distance:{' '}
                <span style={{ color: FATHOM }}>{maxDistanceKm} km</span>
              </Label>
              <Slider
                value={[maxDistanceKm]}
                onValueChange={(vals) => setMaxDistanceKm(vals[0] ?? 10)}
                min={1}
                max={30}
                step={1}
                disabled={!hasLocation}
              />
              {!hasLocation && (
                <p
                  className="text-[11px]"
                  style={{ fontFamily: 'var(--font-mono)', color: SOFT }}
                >
                  set your location in profile to enable distance.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-[10px] uppercase" style={labelStyle}>
                Minimum rating:{' '}
                <span style={{ color: FATHOM }}>{minRating === 0 ? 'Any' : `${minRating}+`}</span>
              </Label>
              <Slider
                value={[minRating]}
                onValueChange={(vals) => setMinRating(vals[0] ?? 0)}
                min={0}
                max={5}
                step={0.5}
              />
            </div>
          </div>
        </div>
      </div>
      </FadeUp>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <p
          className="rounded-xl p-4 text-[13px]"
          style={{ background: 'rgba(127,28,52,0.06)', border: `1px solid ${PULSE}33`, color: PULSE }}
        >
          Could not load restaurants.
        </p>
      ) : data.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center text-[13px]"
          style={{ background: WHITE, border: `1px dashed ${LUMEN_DK}`, color: MUTED }}
        >
          {debouncedSearch
            ? 'No restaurants match your search.'
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
              return (
                <StaggerItem key={r.id}>
                <Link href={`/restaurants/${r.id}`} className="group block h-full">
                  <motion.div
                    whileHover={{ y: -3, boxShadow: '0 10px 24px rgba(0,0,0,0.07)' }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="flex h-full flex-col rounded-2xl p-5"
                    style={{
                      background: WHITE,
                      border: `1px solid ${LUMEN_DK}`,
                      boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className="text-[10px] uppercase"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: SOFT,
                          letterSpacing: '0.18em',
                        }}
                      >
                        {code}
                      </span>
                      {r.rating != null && (
                        <div
                          className="flex shrink-0 items-center gap-1"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          <Star
                            className="h-3.5 w-3.5"
                            style={{ color: AMBER, fill: AMBER }}
                          />
                          <span className="text-[13px] font-medium" style={{ color: VAST }}>
                            {r.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    <h3
                      className="mt-2 truncate"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 18,
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                        color: VAST,
                      }}
                    >
                      {r.name}
                    </h3>

                    <div
                      className="mt-1 flex items-center gap-3 text-[12px]"
                      style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
                    >
                      {r.distanceKm != null && <span>{r.distanceKm.toFixed(1)} km</span>}
                      {r.deliveryFee != null && <span>₨ {r.deliveryFee} fee</span>}
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-2 pt-4">
                      {r.minItemPrice != null ? (
                        <div className="flex flex-col gap-0.5">
                          <span
                            className="flex items-center gap-1.5 text-[10px] uppercase"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              color: SOFT,
                              letterSpacing: '0.18em',
                            }}
                          >
                            {fit && <FitDot fit={fit} />}
                            from
                          </span>
                          <span
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: 16,
                              fontWeight: 600,
                              color: VAST,
                            }}
                          >
                            ₨ {r.minItemPrice.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span
                          className="text-[11px]"
                          style={{ fontFamily: 'var(--font-mono)', color: SOFT }}
                        >
                          no menu yet
                        </span>
                      )}
                      {r.minimumOrder != null && (
                        <span
                          className="text-[11px]"
                          style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
                        >
                          min ₨ {r.minimumOrder}
                        </span>
                      )}
                    </div>
                  </motion.div>
                </Link>
                </StaggerItem>
              );
            })}
          </Stagger>

          {(page > 0 || !isLastPage) && (
            <div className="flex items-center justify-between gap-3">
              <Pill
                variant="ghost"
                size="xs"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isFetching}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                ← prev
              </Pill>
              <p
                className="text-[11px]"
                style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
              >
                page {page + 1}
                {isFetching ? ' · loading…' : ''}
              </p>
              <Pill
                variant="ghost"
                size="xs"
                onClick={() => setPage((p) => p + 1)}
                disabled={isLastPage || isFetching}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                next →
              </Pill>
            </div>
          )}
        </>
      )}
    </div>
  );
}
