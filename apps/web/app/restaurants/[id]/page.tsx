'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useRestaurant, useRestaurantMenu } from '@/hooks/use-restaurant';

export default function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const restaurantQuery = useRestaurant(id);
  const menuQuery = useRestaurantMenu(id);

  const r = restaurantQuery.data;

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
        <Skeleton className="h-24 w-full" />
      ) : restaurantQuery.error ? (
        <p className="text-sm text-destructive">Could not load restaurant.</p>
      ) : !r ? (
        <p className="text-sm text-muted-foreground">Restaurant not found.</p>
      ) : (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-2xl text-card-foreground">{r.name}</CardTitle>
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

      <div>
        <h2 className="text-lg font-semibold text-foreground">Menu</h2>
        {menuQuery.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 mt-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : menuQuery.error ? (
          <p className="text-sm text-destructive">Could not load menu.</p>
        ) : !menuQuery.data?.length ? (
          <p className="text-sm text-muted-foreground mt-3">No menu items yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 mt-3">
            {menuQuery.data.map((item) => (
              <Card key={item.id} className="border-border">
                <CardContent className="flex items-start justify-between gap-4 pt-6">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-card-foreground">{item.name}</p>
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
