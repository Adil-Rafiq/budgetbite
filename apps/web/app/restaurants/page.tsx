'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Star } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';

import { useUser } from '@/hooks/use-user';
import { useRestaurants } from '@/hooks/use-restaurant';

export default function RestaurantsPage() {
  const { data: user } = useUser();
  const userLat = user?.profile?.latitude;
  const userLng = user?.profile?.longitude;

  const [maxDistanceKm, setMaxDistanceKm] = useState(10);
  const [minRating, setMinRating] = useState(0);
  const [search, setSearch] = useState('');

  const query = useMemo(
    () => ({
      limit: 50,
      offset: 0,
      userLat: userLat ?? undefined,
      userLng: userLng ?? undefined,
      maxDistanceKm: userLat != null && userLng != null ? maxDistanceKm : undefined,
      minRating: minRating > 0 ? minRating : undefined,
    }),
    [userLat, userLng, maxDistanceKm, minRating],
  );

  const { data = [], isLoading, error } = useRestaurants(query);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return data;
    return data.filter((r) => r.name.toLowerCase().includes(s));
  }, [data, search]);

  const hasLocation = userLat != null && userLng != null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Restaurants</h1>
        <p className="text-muted-foreground text-sm mt-1">Browse places that deliver to you.</p>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="search">Search by name</Label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. Nihari"
                className="pl-9"
              />
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
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">Could not load restaurants.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {data.length === 0
            ? 'No restaurants found — try widening your radius.'
            : 'No restaurants match your search.'}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
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
                  {r.minimumOrder != null && (
                    <p className="text-xs text-muted-foreground">Min order: PKR {r.minimumOrder}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
