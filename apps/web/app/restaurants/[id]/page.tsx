'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Star } from 'lucide-react';

import { classifyBudgetFit } from '@repo/shared';
import type { BudgetFit, MenuItem } from '@repo/shared';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useRestaurant, useRestaurantMenu } from '@/hooks/use-restaurant';

import { AddToPlanModal } from '../_components/add-to-plan-modal';
import { MenuItemSkeleton } from '../_components/menu-item-skeleton';
import { RestaurantHeaderSkeleton } from '../_components/restaurant-header-skeleton';

const FIT_BADGE: Record<BudgetFit, { label: string; className: string }> = {
  green: { label: 'Fits budget', className: 'bg-chart-2/10 text-chart-2 border-chart-2/30' },
  amber: { label: 'Tight', className: 'bg-chart-4/10 text-chart-4 border-chart-4/30' },
  red: { label: 'Over budget', className: 'bg-destructive/10 text-destructive border-destructive/30' },
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
    <div className="flex flex-col gap-6">
      <Link
        href="/restaurants"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to restaurants
      </Link>

      {restaurantQuery.isLoading ? (
        <RestaurantHeaderSkeleton />
      ) : restaurantQuery.error ? (
        <p className="text-sm text-destructive">Could not load restaurant.</p>
      ) : !r ? (
        <p className="text-sm text-muted-foreground">Restaurant not found.</p>
      ) : (
        <Card className="border-border">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <CardTitle className="text-2xl text-card-foreground">{r.name}</CardTitle>
            {foodpandaUrl && (
              <a href={foodpandaUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="gap-1.5">
                  Order on Foodpanda
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>
            )}
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {r.rating != null && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-chart-4 fill-chart-4" />
                <span className="font-medium text-card-foreground">{r.rating.toFixed(1)}</span>
                {r.ratingCount > 0 && <span>({r.ratingCount.toLocaleString()})</span>}
              </div>
            )}
            {r.deliveryFee != null && <span>Delivery PKR {r.deliveryFee}</span>}
            {r.minimumOrder != null && <span>Min order PKR {r.minimumOrder}</span>}
          </CardContent>
        </Card>
      )}

      {hasActivePlan && avgPerMeal > 0 && (
        <Card className="border-border bg-secondary/30">
          <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-1 pt-6 text-sm">
            <span className="text-muted-foreground">
              Avg meal target:{' '}
              <span className="font-semibold text-foreground">
                PKR {avgPerMeal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </span>
            <span className="text-muted-foreground">
              Remaining:{' '}
              <span className="font-semibold text-foreground">
                PKR {amountRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </span>
            <span className="text-muted-foreground">
              Meals to plan:{' '}
              <span className="font-semibold text-foreground">{mealsRemaining}</span>
            </span>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-foreground">Menu</h2>
        {menuQuery.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 mt-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <MenuItemSkeleton key={i} />
            ))}
          </div>
        ) : menuQuery.error ? (
          <p className="text-sm text-destructive">Could not load menu.</p>
        ) : !menuQuery.data?.length ? (
          <p className="text-sm text-muted-foreground mt-3">No menu items yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 mt-3">
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
                <Card key={item.id} className="border-border overflow-hidden">
                  {item.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <CardContent className="flex flex-col gap-3 pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-card-foreground">{item.name}</p>
                          {fit && (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium uppercase tracking-wide ${FIT_BADGE[fit].className}`}
                            >
                              {FIT_BADGE[fit].label}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-primary">
                          PKR {item.price.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {hasActivePlan && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setPickedItem(item)}
                      >
                        Add to plan
                      </Button>
                    )}
                  </CardContent>
                </Card>
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
