'use client';

import Link from 'next/link';

import { RecommendRestaurantButton } from '@/components/recommend-restaurant-button';
import { useMyRecommendations } from '@/hooks/use-restaurant-recommendations';

export function RecommendCard() {
  const { data } = useMyRecommendations({ limit: 20 });
  const pendingCount = (data?.data ?? []).filter((r) => r.status === 'pending').length;

  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-dashed border-lumen-dk bg-white p-5 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1">
        <h3
          className="text-vast"
          style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}
        >
          Missing a spot?
        </h3>
        <p className="text-[13px] text-ink">
          Recommend a local restaurant and we’ll review it for the menu.
        </p>
        {pendingCount > 0 && (
          <Link
            href="/restaurants/recommendations"
            className="text-[12px] text-fathom underline-offset-2 hover:underline"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {pendingCount} pending review — view yours →
          </Link>
        )}
      </div>
      <RecommendRestaurantButton />
    </div>
  );
}
