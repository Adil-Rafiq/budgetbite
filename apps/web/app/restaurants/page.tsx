'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Star } from 'lucide-react';

import type { RestaurantSort } from '@repo/shared';
import { classifyBudgetFit } from '@repo/shared';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';

import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useUser } from '@/hooks/use-user';
import { useRestaurants } from '@/hooks/use-restaurant';

import { RestaurantCardSkeleton } from './_components/restaurant-card-skeleton';

const PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 300;

function FitDot({ fit }: { fit: 'green' | 'amber' | 'red' }) {
  const cls =
    fit === 'green'
      ? 'bg-chart-2'
      : fit === 'amber'
        ? 'bg-chart-4'
        : 'bg-destructive';
  const label =
    fit === 'green' ? 'Fits budget' : fit === 'amber' ? 'Tight' : 'Over budget';
  return <span className={`inline-block w-2 h-2 rounded-full ${cls}`} aria-label={label} title={label} />;
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

  // Debounce server-side search so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset pagination when filters/sort/search change so we don't show an empty
  // page after narrowing the result set.
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Restaurants</h1>
          <p className="text-muted-foreground text-sm mt-1">Browse places that deliver to you.</p>
        </div>
        {hasActivePlan && avgPerMeal > 0 && (
          <div className="hidden sm:block text-right text-xs text-muted-foreground">
            <p>
              Avg meal target:{' '}
              <span className="font-semibold text-foreground">
                PKR {avgPerMeal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </p>
            <p>
              Remaining:{' '}
              <span className="font-semibold text-foreground">
                PKR {amountRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="search">Search by name</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="e.g. Nihari"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sort">Sort</Label>
              <Select value={sort} onValueChange={(v) => setSort(v as RestaurantSort | 'auto')}>
                <SelectTrigger id="sort" className="w-full">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>
                Max distance: <span className="text-primary">{maxDistanceKm} km</span>
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
                <p className="text-xs text-muted-foreground">
                  Set your location in the Profile page to enable distance filtering.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>
                Minimum rating:{' '}
                <span className="text-primary">{minRating === 0 ? 'Any' : `${minRating}+`}</span>
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
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">Could not load restaurants.</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {debouncedSearch
            ? 'No restaurants match your search.'
            : 'No restaurants found — try widening your radius.'}
        </p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.map((r) => {
              const fit =
                hasActivePlan && r.minItemPrice != null && avgPerMeal > 0
                  ? classifyBudgetFit({
                      itemPrice: r.minItemPrice,
                      avgBudgetPerRemainingMeal: avgPerMeal,
                      amountRemaining,
                    })
                  : null;
              return (
                <Link key={r.id} href={`/restaurants/${r.id}`}>
                  <Card className="border-border hover:border-primary transition-colors h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-base text-card-foreground">{r.name}</CardTitle>
                        {r.rating != null && (
                          <div className="flex items-center gap-1 shrink-0">
                            <Star className="w-3.5 h-3.5 text-chart-4 fill-chart-4" />
                            <span className="text-sm font-medium text-card-foreground">
                              {r.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {r.distanceKm != null && <span>{r.distanceKm.toFixed(1)} km away</span>}
                        {r.deliveryFee != null && <span>PKR {r.deliveryFee} fee</span>}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        {r.minItemPrice != null ? (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            {fit && <FitDot fit={fit} />}
                            From PKR {r.minItemPrice.toLocaleString()}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground/70">No menu yet</p>
                        )}
                        {r.minimumOrder != null && (
                          <p className="text-xs text-muted-foreground">
                            Min PKR {r.minimumOrder}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Pagination — server-driven, page size constant. Only shows when
              we have more than one page worth of results to flip through. */}
          {(page > 0 || !isLastPage) && (
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isFetching}
              >
                Previous
              </Button>
              <p className="text-xs text-muted-foreground">
                Page {page + 1}
                {isFetching ? ' · loading…' : ''}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={isLastPage || isFetching}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
