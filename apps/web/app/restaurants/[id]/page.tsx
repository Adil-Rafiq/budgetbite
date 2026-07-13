'use client';

import { useMemo, useState, use } from 'react';
import Link from 'next/link';
import { ExternalLink, Phone, Search, Star, Utensils } from 'lucide-react';

import { classifyBudgetFit, haversineKm } from '@repo/shared';
import type { BudgetFit, MenuItem } from '@repo/shared';

import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useRestaurant, useRestaurantMenu } from '@/hooks/use-restaurant';
import { useUser } from '@/hooks/use-user';
import { pricesUpdatedAgoLabel } from '@/lib/date';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { FoodPreferenceToggle } from '@/components/food-preference-toggle';

import { AddToPlanModal } from '../_components/add-to-plan-modal';
import { MenuItemSkeleton } from '../_components/menu-item-skeleton';
import { RestaurantHeaderSkeleton } from '../_components/restaurant-header-skeleton';

const FIT_PILL: Record<BudgetFit, { className: string; label: string }> = {
  green: { className: 'bg-green/10 text-dark-green', label: 'Fits budget' },
  amber: { className: 'bg-[#fef6e6] text-[#8a5a12]', label: 'Tight' },
  red: { className: 'bg-tomato/10 text-tomato', label: 'Over budget' },
};

const MENU_CONTROLS_THRESHOLD = 6;

type MenuSort = 'default' | 'price-asc' | 'price-desc' | 'fit';

const FIT_RANK: Record<BudgetFit | 'none', number> = {
  green: 0,
  amber: 1,
  red: 2,
  none: 3,
};

function buildFoodpandaUrl(externalId: string, slug: string): string {
  return `https://www.foodpanda.pk/restaurant/${externalId}/${slug}`;
}

const formatPkr = (n: number) => `₨ ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const labelClass = 'text-[10px] font-semibold uppercase tracking-[0.18em] text-slate/60';
const inputClass = 'bg-canvas border-sage text-charcoal';

export default function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const restaurantQuery = useRestaurant(id);
  const menuQuery = useRestaurantMenu(id);
  const { data: activePlan } = useActiveBudgetPlan();
  const { data: user } = useUser();

  const [pickedItem, setPickedItem] = useState<MenuItem | null>(null);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuSort, setMenuSort] = useState<MenuSort>('default');
  const [budgetOnly, setBudgetOnly] = useState(false);

  const r = restaurantQuery.data;
  const hasActivePlan = !!activePlan;
  const avgPerMeal = activePlan?.budgetState.avgBudgetPerRemainingMeal ?? 0;
  const amountRemaining = activePlan?.budgetState.amountRemaining ?? 0;
  const mealsRemaining = activePlan?.budgetState.mealsRemaining ?? 0;
  const foodpandaUrl = r?.externalId && r?.slug ? buildFoodpandaUrl(r.externalId, r.slug) : null;

  const userLat = user?.profile?.latitude;
  const userLng = user?.profile?.longitude;
  const distanceKm =
    r && userLat != null && userLng != null && r.latitude != null && r.longitude != null
      ? haversineKm(userLat, userLng, r.latitude, r.longitude)
      : null;

  const canSortByFit = hasActivePlan && avgPerMeal > 0;

  const menuStats = useMemo(() => {
    const items = menuQuery.data ?? [];
    if (items.length === 0) return null;
    const prices = items.map((i) => i.price);
    const sum = prices.reduce((a, b) => a + b, 0);
    const newestUpdate = items.reduce<number>(
      (max, i) => Math.max(max, new Date(i.updatedAt).getTime()),
      0,
    );
    return {
      count: items.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: sum / items.length,
      freshness: newestUpdate > 0 ? pricesUpdatedAgoLabel(new Date(newestUpdate)) : null,
    };
  }, [menuQuery.data]);

  const filteredMenu = useMemo(() => {
    let items = menuQuery.data ?? [];

    const q = menuSearch.trim().toLowerCase();
    if (q) items = items.filter((i) => i.name.toLowerCase().includes(q));

    if (budgetOnly && canSortByFit) {
      items = items.filter((i) => {
        const fit = classifyBudgetFit({
          itemPrice: i.price,
          avgBudgetPerRemainingMeal: avgPerMeal,
          amountRemaining,
        });
        return fit !== 'red';
      });
    }

    if (menuSort === 'price-asc') {
      items = [...items].sort((a, b) => a.price - b.price);
    } else if (menuSort === 'price-desc') {
      items = [...items].sort((a, b) => b.price - a.price);
    } else if (menuSort === 'fit' && canSortByFit) {
      items = [...items].sort((a, b) => {
        const fa = classifyBudgetFit({
          itemPrice: a.price,
          avgBudgetPerRemainingMeal: avgPerMeal,
          amountRemaining,
        });
        const fb = classifyBudgetFit({
          itemPrice: b.price,
          avgBudgetPerRemainingMeal: avgPerMeal,
          amountRemaining,
        });
        return FIT_RANK[fa] - FIT_RANK[fb];
      });
    }

    return items;
  }, [menuQuery.data, menuSearch, menuSort, budgetOnly, canSortByFit, avgPerMeal, amountRemaining]);

  const showMenuControls = (menuStats?.count ?? 0) > MENU_CONTROLS_THRESHOLD;
  const filtersActive = menuSearch.trim().length > 0 || menuSort !== 'default' || budgetOnly;

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">
      <Link
        href="/restaurants"
        className="inline-flex w-fit items-center gap-1.5 text-[12px] text-slate transition-colors hover:text-green"
      >
        ← Back to restaurants
      </Link>

      {restaurantQuery.isLoading ? (
        <RestaurantHeaderSkeleton />
      ) : restaurantQuery.error ? (
        <p className="rounded-xl border border-tomato/20 bg-tomato/[0.06] p-4 text-[13px] text-tomato">
          Could not load restaurant.
        </p>
      ) : !r ? (
        <p className="text-[13px] text-slate">Restaurant not found.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-sage bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold uppercase tracking-widest text-green">
                Restaurant
              </div>
              <h1 className="font-display text-[clamp(24px,3vw,32px)] font-semibold leading-[1.05] tracking-tight text-charcoal">
                {r.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-slate">
                {r.rating != null && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-[#f5a623]" style={{ fill: '#f5a623' }} />
                    <span className="font-semibold text-charcoal">{r.rating.toFixed(1)}</span>
                    {r.ratingCount > 0 && <span>({r.ratingCount.toLocaleString()})</span>}
                  </span>
                )}
                {distanceKm != null && <span>{distanceKm.toFixed(1)} km away</span>}
                {r.deliveryFee != null && <span>delivery ₨ {r.deliveryFee}</span>}
                {r.minimumOrder != null && <span>min order ₨ {r.minimumOrder}</span>}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <FoodPreferenceToggle
                targetType="restaurant"
                targetId={r.id}
                name={r.name}
                size="md"
              />
              {foodpandaUrl ? (
                <a
                  href={foodpandaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-dark-green"
                >
                  Order on Foodpanda
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                r.orderUrl && (
                  <a
                    href={r.orderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-dark-green"
                  >
                    Order online
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )
              )}
              {r.phone && (
                <a
                  href={`tel:${r.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sage bg-white px-4 py-2 text-[13px] font-medium text-slate transition-colors hover:bg-canvas"
                >
                  Call
                  <Phone className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {hasActivePlan && avgPerMeal > 0 ? (
        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-sage bg-canvas p-4">
          {[
            { label: 'Avg / meal', value: formatPkr(avgPerMeal) },
            { label: 'Remaining', value: formatPkr(amountRemaining) },
            { label: 'Meals left', value: String(mealsRemaining) },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate/60">
                {label}
              </span>
              <span className="font-display text-base font-semibold tracking-tight text-charcoal">
                {value}
              </span>
            </div>
          ))}
        </div>
      ) : (
        !restaurantQuery.isLoading && (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-sage bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-slate">
              Start a budget plan to see fit and log meals from here.
            </p>
            <Link
              href="/plans"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-sage bg-white px-3 py-1.5 text-[12px] font-medium text-slate transition-colors hover:bg-canvas"
            >
              Create a plan
              <span className="opacity-70">→</span>
            </Link>
          </div>
        )
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-green">Menu</span>
            <h2 className="font-display text-[22px] font-semibold tracking-tight text-charcoal">
              Menu
            </h2>
          </div>
          {menuStats && (
            <span className="text-[11px] text-slate/60">
              {menuStats.count} item{menuStats.count === 1 ? '' : 's'} · {formatPkr(menuStats.min)}{' '}
              – {formatPkr(menuStats.max)} · avg {formatPkr(menuStats.avg)}
              {menuStats.freshness ? ` · ${menuStats.freshness}` : ''}
            </span>
          )}
        </div>

        {showMenuControls && (
          <div className="overflow-hidden rounded-2xl border border-sage bg-white shadow-sm">
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
              <div className="flex flex-col gap-2">
                <Label htmlFor="menu-search" className={labelClass}>
                  Search menu
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate/60" />
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
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="price-asc">Price: low → high</SelectItem>
                    <SelectItem value="price-desc">Price: high → low</SelectItem>
                    {canSortByFit && <SelectItem value="fit">Best fit first</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              {canSortByFit && (
                <button
                  type="button"
                  onClick={() => setBudgetOnly((v) => !v)}
                  aria-pressed={budgetOnly}
                  className={`h-[38px] rounded-full border px-3 text-[12px] font-medium transition-colors ${
                    budgetOnly
                      ? 'border-green bg-green/10 text-dark-green'
                      : 'border-sage bg-canvas text-slate hover:border-green/40'
                  }`}
                >
                  {budgetOnly ? '✓ within budget' : 'within budget'}
                </button>
              )}
            </div>
          </div>
        )}

        {menuQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <MenuItemSkeleton key={i} />
            ))}
          </div>
        ) : menuQuery.error ? (
          <p className="rounded-xl border border-tomato/20 bg-tomato/[0.06] p-4 text-[13px] text-tomato">
            Could not load menu.
          </p>
        ) : !menuQuery.data?.length ? (
          <div className="rounded-2xl border border-dashed border-sage bg-white p-6 text-center text-[13px] text-slate">
            No menu items yet.
          </div>
        ) : filteredMenu.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sage bg-white p-6 text-center text-[13px] text-slate">
            No items match your filters.
            {filtersActive && (
              <button
                type="button"
                onClick={() => {
                  setMenuSearch('');
                  setMenuSort('default');
                  setBudgetOnly(false);
                }}
                className="ml-1 text-green underline-offset-2 hover:underline"
              >
                clear
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMenu.map((item) => {
              const fit =
                hasActivePlan && avgPerMeal > 0
                  ? classifyBudgetFit({
                      itemPrice: item.price,
                      avgBudgetPerRemainingMeal: avgPerMeal,
                      amountRemaining,
                    })
                  : null;
              return (
                <div
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-sage bg-white shadow-sm"
                >
                  {item.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="flex h-32 w-full items-center justify-center bg-canvas"
                    >
                      <Utensils className="h-8 w-8 text-slate/40" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[14px] font-medium text-charcoal">
                            {item.name}
                          </p>
                          {fit && (
                            <span
                              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${FIT_PILL[fit].className}`}
                            >
                              {FIT_PILL[fit].label}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-1 line-clamp-3 text-[12px] text-slate">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 whitespace-nowrap text-right font-display text-base font-semibold text-green">
                        ₨ {item.price.toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-auto flex items-center gap-2 pt-1">
                      <FoodPreferenceToggle
                        targetType="menu_item"
                        targetId={item.id}
                        name={item.name}
                      />
                      {hasActivePlan && (
                        <button
                          type="button"
                          onClick={() => setPickedItem(item)}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-sage bg-white px-3 py-1.5 text-[12px] font-medium text-slate transition-colors hover:bg-canvas"
                        >
                          Add to plan
                          <span className="opacity-70">+</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pickedItem && r && (
        <AddToPlanModal
          open={!!pickedItem}
          onOpenChange={(open) => !open && setPickedItem(null)}
          restaurantId={r.id}
          restaurantName={r.name}
          menuItem={pickedItem}
        />
      )}
    </div>
  );
}
