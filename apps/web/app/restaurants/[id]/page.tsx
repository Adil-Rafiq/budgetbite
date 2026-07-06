'use client';

import { useMemo, useState, use } from 'react';
import Link from 'next/link';
import { ExternalLink, Phone, Search, Star, Utensils } from 'lucide-react';

import { classifyBudgetFit, haversineKm } from '@repo/shared';
import type { BudgetFit, MenuItem } from '@repo/shared';

import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useRestaurant, useRestaurantMenu } from '@/hooks/use-restaurant';
import { useUser } from '@/hooks/use-user';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pill } from '@/components/ui/pill';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { AddToPlanModal } from '../_components/add-to-plan-modal';
import { MenuItemSkeleton } from '../_components/menu-item-skeleton';
import { RestaurantHeaderSkeleton } from '../_components/restaurant-header-skeleton';

const FIT_PILL: Record<BudgetFit, { className: string; label: string }> = {
  green: { className: 'bg-fathom/[0.08] text-fathom', label: 'Fits budget' },
  amber: { className: 'bg-amber/[0.08] text-amber', label: 'Tight' },
  red: { className: 'bg-pulse/[0.08] text-pulse', label: 'Over budget' },
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

const labelClass = 'text-[10px] uppercase text-soft';
const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.18em',
};
const inputClass = 'bg-lumen border-lumen-dk text-vast';

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
    return {
      count: items.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: sum / items.length,
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
        className="inline-flex w-fit items-center gap-1.5 text-[12px] text-ink transition hover:opacity-80"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        ← back to restaurants
      </Link>

      {restaurantQuery.isLoading ? (
        <RestaurantHeaderSkeleton />
      ) : restaurantQuery.error ? (
        <p className="rounded-xl border border-pulse/20 bg-pulse/[0.06] p-4 text-[13px] text-pulse">
          Could not load restaurant.
        </p>
      ) : !r ? (
        <p className="text-[13px] text-ink">Restaurant not found.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-lumen-dk bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <div
                className="text-[10px] uppercase text-fathom"
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
              >
                /restaurant
              </div>
              <h1
                className="text-vast"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(24px, 3vw, 32px)',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.05,
                }}
              >
                {r.name}
              </h1>
              <div
                className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-ink"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {r.rating != null && (
                  <span className="inline-flex items-center gap-1">
                    <Star
                      className="h-3.5 w-3.5 text-amber"
                      style={{ fill: 'var(--color-amber)' }}
                    />
                    <span className="font-semibold text-vast">{r.rating.toFixed(1)}</span>
                    {r.ratingCount > 0 && <span>({r.ratingCount.toLocaleString()})</span>}
                  </span>
                )}
                {distanceKm != null && <span>{distanceKm.toFixed(1)} km away</span>}
                {r.deliveryFee != null && <span>delivery ₨ {r.deliveryFee}</span>}
                {r.minimumOrder != null && <span>min order ₨ {r.minimumOrder}</span>}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              {foodpandaUrl ? (
                <Pill asChild size="sm">
                  <a href={foodpandaUrl} target="_blank" rel="noopener noreferrer">
                    Order on Foodpanda
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Pill>
              ) : (
                r.orderUrl && (
                  <Pill asChild size="sm">
                    <a href={r.orderUrl} target="_blank" rel="noopener noreferrer">
                      Order online
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Pill>
                )
              )}
              {r.phone && (
                <Pill asChild variant="ghost" size="sm">
                  <a href={`tel:${r.phone}`}>
                    Call
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                </Pill>
              )}
            </div>
          </div>
        </div>
      )}

      {hasActivePlan && avgPerMeal > 0 ? (
        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-lumen-dk bg-lumen p-4">
          {[
            { label: 'avg / meal', value: formatPkr(avgPerMeal) },
            { label: 'remaining', value: formatPkr(amountRemaining) },
            { label: 'meals left', value: String(mealsRemaining) },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <span
                className="text-[10px] uppercase text-soft"
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
              >
                {label}
              </span>
              <span
                className="text-vast"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      ) : (
        !restaurantQuery.isLoading && (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-lumen-dk bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-ink">
              Start a budget plan to see fit and log meals from here.
            </p>
            <Pill asChild variant="ghost" size="xs" className="shrink-0">
              <Link href="/plans">
                Create a plan
                <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>→</span>
              </Link>
            </Pill>
          </div>
        )
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span
              className="text-[10px] uppercase text-fathom"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
            >
              /menu
            </span>
            <h2
              className="text-vast"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              Menu
            </h2>
          </div>
          {menuStats && (
            <span className="text-[11px] text-soft" style={{ fontFamily: 'var(--font-mono)' }}>
              {menuStats.count} item{menuStats.count === 1 ? '' : 's'} · {formatPkr(menuStats.min)}{' '}
              – {formatPkr(menuStats.max)} · avg {formatPkr(menuStats.avg)}
            </span>
          )}
        </div>

        {showMenuControls && (
          <div className="overflow-hidden rounded-2xl border border-lumen-dk bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
              <div className="flex flex-col gap-2">
                <Label htmlFor="menu-search" className={labelClass} style={labelStyle}>
                  Search menu
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" />
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
                <Label htmlFor="menu-sort" className={labelClass} style={labelStyle}>
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
                  className={`h-[38px] rounded-full border px-3 text-[12px] transition-colors ${
                    budgetOnly
                      ? 'border-fathom bg-fathom/[0.08] text-fathom'
                      : 'border-lumen-dk bg-lumen text-ink hover:border-fathom/40'
                  }`}
                  style={{ fontFamily: 'var(--font-mono)' }}
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
          <p className="rounded-xl border border-pulse/20 bg-pulse/[0.06] p-4 text-[13px] text-pulse">
            Could not load menu.
          </p>
        ) : !menuQuery.data?.length ? (
          <div className="rounded-2xl border border-dashed border-lumen-dk bg-white p-6 text-center text-[13px] text-ink">
            No menu items yet.
          </div>
        ) : filteredMenu.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-lumen-dk bg-white p-6 text-center text-[13px] text-ink">
            No items match your filters.
            {filtersActive && (
              <button
                type="button"
                onClick={() => {
                  setMenuSearch('');
                  setMenuSort('default');
                  setBudgetOnly(false);
                }}
                className="ml-1 text-fathom underline-offset-2 hover:underline"
                style={{ fontFamily: 'var(--font-mono)' }}
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
                  className="flex flex-col overflow-hidden rounded-2xl border border-lumen-dk bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]"
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
                      className="flex h-32 w-full items-center justify-center bg-lumen"
                    >
                      <Utensils className="h-8 w-8 text-soft/50" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[14px] font-medium text-vast">{item.name}</p>
                          {fit && (
                            <span
                              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase ${FIT_PILL[fit].className}`}
                              style={{
                                fontFamily: 'var(--font-mono)',
                                letterSpacing: '0.18em',
                              }}
                            >
                              {FIT_PILL[fit].label}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-1 line-clamp-3 text-[12px] text-ink">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <span
                        className="shrink-0 whitespace-nowrap text-right text-fathom"
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 16,
                          fontWeight: 600,
                        }}
                      >
                        ₨ {item.price.toLocaleString()}
                      </span>
                    </div>

                    {hasActivePlan && (
                      <Pill
                        variant="ghost"
                        size="sm"
                        onClick={() => setPickedItem(item)}
                        className="w-full"
                      >
                        Add to plan
                        <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>+</span>
                      </Pill>
                    )}
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
