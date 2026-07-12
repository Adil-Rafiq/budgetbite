'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import {
  MAX_PENDING_RESTAURANT_RECOMMENDATIONS,
  type RestaurantRecommendation,
} from '@repo/shared';

import {
  useMyRecommendations,
  useWithdrawRecommendation,
} from '@/hooks/use-restaurant-recommendations';
import { FadeUp, Stagger, StaggerItem } from '@/components/motion';
import { RecommendRestaurantButton } from '@/components/recommend-restaurant-button';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PAGE_SIZE = 12;
const ITEM_PREVIEW_COUNT = 3;

const STATUS_PILL: Record<string, { className: string; label: string }> = {
  pending: { className: 'bg-[#fef6e6] text-[#8a5a12]', label: 'Pending review' },
  approved: { className: 'bg-green/10 text-dark-green', label: 'Approved' },
  rejected: { className: 'bg-tomato/10 text-tomato', label: 'Rejected' },
};

function formatDate(value: Date | string): string {
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function RecommendationCard({
  rec,
  onWithdraw,
}: {
  rec: RestaurantRecommendation;
  onWithdraw: (rec: RestaurantRecommendation) => void;
}) {
  const status = STATUS_PILL[rec.status];
  const preview = rec.items.slice(0, ITEM_PREVIEW_COUNT);
  const extra = rec.items.length - preview.length;

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-sage bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 truncate font-display text-lg font-semibold tracking-tight text-charcoal">
          {rec.name}
        </h3>
        {status && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${status.className}`}
          >
            {status.label}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate">
        <span>Sent {formatDate(rec.createdAt)}</span>
        {rec.area && <span>· {rec.area}</span>}
        <span>
          · {rec.items.length} item{rec.items.length === 1 ? '' : 's'}
        </span>
      </div>

      {preview.length > 0 && (
        <ul className="flex flex-col gap-1">
          {preview.map((item, i) => (
            <li
              key={`${item.name}-${i}`}
              className="flex items-baseline justify-between gap-2 text-[13px]"
            >
              <span className="truncate text-charcoal">{item.name}</span>
              <span className="shrink-0 text-slate">₨ {item.price.toLocaleString()}</span>
            </li>
          ))}
          {extra > 0 && <li className="text-[11px] text-slate/60">+{extra} more</li>}
        </ul>
      )}

      {rec.status === 'rejected' && rec.adminNote && (
        <p className="rounded-xl border border-tomato/20 bg-tomato/[0.06] p-3 text-[12px] text-slate">
          <span className="font-medium text-tomato">Admin note:</span> {rec.adminNote}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        {rec.status === 'approved' && rec.createdRestaurantId ? (
          <Link
            href={`/restaurants/${rec.createdRestaurantId}`}
            className="text-[12px] font-medium text-green underline-offset-2 hover:underline"
          >
            View restaurant →
          </Link>
        ) : (
          <span className="text-[11px] text-slate/60">
            {rec.status === 'pending'
              ? 'Awaiting admin review'
              : `Reviewed ${rec.reviewedAt ? formatDate(rec.reviewedAt) : ''}`}
          </span>
        )}
        {rec.status === 'pending' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-tomato hover:text-tomato"
            onClick={() => onWithdraw(rec)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Withdraw
          </Button>
        )}
      </div>
    </div>
  );
}

export default function MyRecommendationsPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading, error, isFetching } = useMyRecommendations({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });
  const withdraw = useWithdrawRecommendation();
  const [withdrawTarget, setWithdrawTarget] = useState<RestaurantRecommendation | null>(null);

  const recommendations = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;
  const pendingCount = recommendations.filter((r) => r.status === 'pending').length;

  const confirmWithdraw = () => {
    if (!withdrawTarget) return;
    withdraw.mutate(withdrawTarget.id, {
      onSettled: () => setWithdrawTarget(null),
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <FadeUp>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold uppercase tracking-widest text-green">
              Community · Recommendations
            </div>
            <h1 className="font-display text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.05] tracking-tight text-charcoal">
              Your recommendations
            </h1>
            <p className="max-w-[540px] text-[14px] text-slate">
              Restaurants you’ve suggested and where they are in review. Pending ones can be
              withdrawn; reviewed ones stay as history.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/restaurants"
              className="inline-flex items-center gap-1.5 text-[12px] text-slate underline-offset-2 transition-colors hover:text-green hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All restaurants
            </Link>
            <RecommendRestaurantButton />
          </div>
        </header>
      </FadeUp>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[180px] animate-pulse rounded-2xl border border-sage bg-sage/40"
            />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-xl border border-tomato/20 bg-tomato/[0.06] p-4 text-[13px] text-tomato">
          Could not load your recommendations.
        </p>
      ) : recommendations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-sage bg-white p-10 text-center">
          <p className="font-display text-[14px] font-semibold text-charcoal">Nothing here yet.</p>
          <p className="max-w-[380px] text-[13px] text-slate">
            Know a great local spot we don’t have? Recommend it and an admin will review it for the
            menu.
          </p>
        </div>
      ) : (
        <>
          {pendingCount > 0 && (
            <p className="text-[12px] text-slate">
              {pendingCount} / {MAX_PENDING_RESTAURANT_RECOMMENDATIONS} pending slots used
            </p>
          )}
          <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
            {recommendations.map((rec) => (
              <StaggerItem key={rec.id}>
                <RecommendationCard rec={rec} onWithdraw={setWithdrawTarget} />
              </StaggerItem>
            ))}
          </Stagger>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isFetching}
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
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * PAGE_SIZE >= total || isFetching}
                className="inline-flex items-center rounded-lg border border-sage bg-white px-3 py-1.5 text-[12px] font-medium text-slate transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <AlertDialog
        open={withdrawTarget != null}
        onOpenChange={(open) => {
          if (!open) setWithdrawTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-tomato">
              Confirm withdrawal
            </div>
            <AlertDialogTitle className="font-display text-[22px] font-semibold tracking-tight text-charcoal">
              Withdraw “{withdrawTarget?.name}”?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate">
              This removes it from the review queue for good. If you change your mind, you’ll have
              to submit it again from scratch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-lg border border-sage bg-white px-4 py-2 text-[13px] font-medium text-slate transition-colors hover:bg-canvas active:scale-[0.97]"
              disabled={withdraw.isPending}
            >
              Keep it
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Keep the dialog open (showing the pending state) until the request settles.
                e.preventDefault();
                confirmWithdraw();
              }}
              disabled={withdraw.isPending}
              className="rounded-lg bg-tomato px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-tomato/90 active:scale-[0.97]"
            >
              {withdraw.isPending ? 'Withdrawing…' : 'Withdraw'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
