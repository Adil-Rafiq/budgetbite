'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { ExternalLink, Star } from 'lucide-react';

import { classifyBudgetFit } from '@repo/shared';
import type { BudgetFit, MenuItem } from '@repo/shared';

import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useRestaurant, useRestaurantMenu } from '@/hooks/use-restaurant';

import { Pill } from '@/components/ui/pill';

import { AddToPlanModal } from '../_components/add-to-plan-modal';
import { MenuItemSkeleton } from '../_components/menu-item-skeleton';
import { RestaurantHeaderSkeleton } from '../_components/restaurant-header-skeleton';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const PULSE = '#7f1c34';
const AMBER = '#b8741a';
const WHITE = '#ffffff';
const MUTED = '#71716a';
const SOFT = '#a6a691';

const FIT_TINT: Record<BudgetFit, { tint: string; label: string }> = {
  green: { tint: FATHOM, label: 'Fits budget' },
  amber: { tint: AMBER, label: 'Tight' },
  red: { tint: PULSE, label: 'Over budget' },
};

function buildFoodpandaUrl(externalId: string, slug: string): string {
  return `https://www.foodpanda.pk/restaurant/${externalId}/${slug}`;
}

export default function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const restaurantQuery = useRestaurant(id);
  const menuQuery = useRestaurantMenu(id);
  const { data: activePlan } = useActiveBudgetPlan();

  const [pickedItem, setPickedItem] = useState<MenuItem | null>(null);

  const r = restaurantQuery.data;
  const hasActivePlan = !!activePlan;
  const avgPerMeal = activePlan?.budgetState.avgBudgetPerRemainingMeal ?? 0;
  const amountRemaining = activePlan?.budgetState.amountRemaining ?? 0;
  const mealsRemaining = activePlan?.budgetState.mealsRemaining ?? 0;
  const foodpandaUrl =
    r?.externalId && r?.slug ? buildFoodpandaUrl(r.externalId, r.slug) : null;

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">
      <Link
        href="/restaurants"
        className="inline-flex w-fit items-center gap-1.5 text-[12px] transition hover:opacity-80"
        style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
      >
        ← back to restaurants
      </Link>

      {restaurantQuery.isLoading ? (
        <RestaurantHeaderSkeleton />
      ) : restaurantQuery.error ? (
        <p
          className="rounded-xl p-4 text-[13px]"
          style={{ background: 'rgba(127,28,52,0.06)', border: `1px solid ${PULSE}33`, color: PULSE }}
        >
          Could not load restaurant.
        </p>
      ) : !r ? (
        <p className="text-[13px]" style={{ color: MUTED }}>
          Restaurant not found.
        </p>
      ) : (
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: WHITE,
            border: `1px solid ${LUMEN_DK}`,
            boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
          }}
        >
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <div
                className="text-[10px] uppercase"
                style={{ fontFamily: 'var(--font-mono)', color: FATHOM, letterSpacing: '0.22em' }}
              >
                /restaurant
              </div>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(24px, 3vw, 32px)',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.05,
                  color: VAST,
                }}
              >
                {r.name}
              </h1>
              <div
                className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px]"
                style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
              >
                {r.rating != null && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" style={{ color: AMBER, fill: AMBER }} />
                    <span style={{ color: VAST, fontWeight: 600 }}>{r.rating.toFixed(1)}</span>
                    {r.ratingCount > 0 && <span>({r.ratingCount.toLocaleString()})</span>}
                  </span>
                )}
                {r.deliveryFee != null && <span>delivery ₨ {r.deliveryFee}</span>}
                {r.minimumOrder != null && <span>min ₨ {r.minimumOrder}</span>}
              </div>
            </div>

            {foodpandaUrl && (
              <Pill asChild size="sm" className="shrink-0">
                <a href={foodpandaUrl} target="_blank" rel="noopener noreferrer">
                  Order on Foodpanda
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Pill>
            )}
          </div>
        </div>
      )}

      {hasActivePlan && avgPerMeal > 0 && (
        <div
          className="grid grid-cols-3 gap-3 rounded-2xl p-4"
          style={{
            background: LUMEN,
            border: `1px solid ${LUMEN_DK}`,
          }}
        >
          {[
            {
              label: 'avg / meal',
              value: `₨ ${avgPerMeal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            },
            {
              label: 'remaining',
              value: `₨ ${amountRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            },
            { label: 'meals to plan', value: String(mealsRemaining) },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <span
                className="text-[10px] uppercase"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: SOFT,
                  letterSpacing: '0.18em',
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  fontWeight: 600,
                  color: VAST,
                  letterSpacing: '-0.01em',
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <span
              className="text-[10px] uppercase"
              style={{ fontFamily: 'var(--font-mono)', color: FATHOM, letterSpacing: '0.22em' }}
            >
              /menu
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: VAST,
              }}
            >
              Menu
            </h2>
          </div>
          {menuQuery.data && (
            <span
              className="text-[11px]"
              style={{ fontFamily: 'var(--font-mono)', color: SOFT }}
            >
              {menuQuery.data.length} item{menuQuery.data.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {menuQuery.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <MenuItemSkeleton key={i} />
            ))}
          </div>
        ) : menuQuery.error ? (
          <p
            className="rounded-xl p-4 text-[13px]"
            style={{
              background: 'rgba(127,28,52,0.06)',
              border: `1px solid ${PULSE}33`,
              color: PULSE,
            }}
          >
            Could not load menu.
          </p>
        ) : !menuQuery.data?.length ? (
          <div
            className="rounded-2xl p-6 text-center text-[13px]"
            style={{ background: WHITE, border: `1px dashed ${LUMEN_DK}`, color: MUTED }}
          >
            No menu items yet.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {menuQuery.data.map((item) => {
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
                  className="flex flex-col overflow-hidden rounded-2xl"
                  style={{
                    background: WHITE,
                    border: `1px solid ${LUMEN_DK}`,
                    boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
                  }}
                >
                  {item.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      className="h-32 w-full object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className="truncate text-[14px]"
                            style={{ color: VAST, fontWeight: 500 }}
                          >
                            {item.name}
                          </p>
                          {fit && (
                            <span
                              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase"
                              style={{
                                fontFamily: 'var(--font-mono)',
                                background: `${FIT_TINT[fit].tint}14`,
                                color: FIT_TINT[fit].tint,
                                letterSpacing: '0.18em',
                              }}
                            >
                              {FIT_TINT[fit].label}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p
                            className="mt-1 line-clamp-3 text-[12px]"
                            style={{ color: MUTED }}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>
                      <span
                        className="shrink-0 whitespace-nowrap text-right"
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 16,
                          fontWeight: 600,
                          color: FATHOM,
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
