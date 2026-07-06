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
import { Pill } from '@/components/ui/pill';
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

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.18em',
};

const STATUS_PILL: Record<string, { className: string; label: string }> = {
  pending: { className: 'bg-amber/[0.12] text-amber', label: 'pending review' },
  approved: { className: 'bg-fathom/10 text-fathom', label: 'approved' },
  rejected: { className: 'bg-pulse/10 text-pulse', label: 'rejected' },
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
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-lumen-dk bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="flex items-start justify-between gap-3">
        <h3
          className="min-w-0 truncate text-vast"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          {rec.name}
        </h3>
        {status && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] uppercase ${status.className}`}
            style={labelStyle}
          >
            {status.label}
          </span>
        )}
      </div>

      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <span>sent {formatDate(rec.createdAt)}</span>
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
              <span className="truncate text-vast">{item.name}</span>
              <span className="shrink-0 text-ink" style={{ fontFamily: 'var(--font-mono)' }}>
                ₨ {item.price.toLocaleString()}
              </span>
            </li>
          ))}
          {extra > 0 && (
            <li className="text-[11px] text-soft" style={{ fontFamily: 'var(--font-mono)' }}>
              +{extra} more
            </li>
          )}
        </ul>
      )}

      {rec.status === 'rejected' && rec.adminNote && (
        <p className="rounded-xl border border-pulse/20 bg-pulse/[0.06] p-3 text-[12px] text-ink">
          <span className="font-medium text-pulse">Admin note:</span> {rec.adminNote}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        {rec.status === 'approved' && rec.createdRestaurantId ? (
          <Link
            href={`/restaurants/${rec.createdRestaurantId}`}
            className="text-[12px] text-fathom underline-offset-2 hover:underline"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            view restaurant →
          </Link>
        ) : (
          <span className="text-[11px] text-soft" style={{ fontFamily: 'var(--font-mono)' }}>
            {rec.status === 'pending'
              ? 'awaiting admin review'
              : `reviewed ${rec.reviewedAt ? formatDate(rec.reviewedAt) : ''}`}
          </span>
        )}
        {rec.status === 'pending' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-pulse hover:text-pulse"
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
            <div
              className="text-[10px] uppercase text-fathom"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
            >
              community · /restaurants/recommendations
            </div>
            <h1
              className="text-vast"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 3.6vw, 40px)',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                lineHeight: 1.05,
              }}
            >
              Your recommendations.
            </h1>
            <p className="max-w-[540px] text-[14px] text-ink">
              Restaurants you’ve suggested and where they are in review. Pending ones can be
              withdrawn; reviewed ones stay as history.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/restaurants"
              className="inline-flex items-center gap-1.5 text-[12px] text-ink underline-offset-2 hover:text-vast hover:underline"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              all restaurants
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
              className="h-[180px] animate-pulse rounded-2xl border border-lumen-dk bg-white"
            />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-xl border border-pulse/20 bg-pulse/[0.06] p-4 text-[13px] text-pulse">
          Could not load your recommendations.
        </p>
      ) : recommendations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-lumen-dk bg-white p-10 text-center">
          <p className="text-[14px] text-vast" style={{ fontFamily: 'var(--font-display)' }}>
            Nothing here yet.
          </p>
          <p className="max-w-[380px] text-[13px] text-ink">
            Know a great local spot we don’t have? Recommend it and an admin will review it for the
            menu.
          </p>
        </div>
      ) : (
        <>
          {pendingCount > 0 && (
            <p className="text-[12px] text-ink" style={{ fontFamily: 'var(--font-mono)' }}>
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
              <Pill
                variant="ghost"
                size="xs"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isFetching}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                ← prev
              </Pill>
              <p className="text-[11px] text-ink" style={{ fontFamily: 'var(--font-mono)' }}>
                page {page + 1} of {totalPages} · {total} total
                {isFetching ? ' · loading…' : ''}
              </p>
              <Pill
                variant="ghost"
                size="xs"
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * PAGE_SIZE >= total || isFetching}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                next →
              </Pill>
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
            <div
              className="text-[10px] uppercase text-pulse"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
            >
              confirm · /withdraw
            </div>
            <AlertDialogTitle
              className="text-vast"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              Withdraw “{withdrawTarget?.name}”?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-ink">
              This removes it from the review queue for good. If you change your mind, you’ll have
              to submit it again from scratch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-full border border-lumen-dk bg-transparent px-4 py-2 text-[13px] text-vast transition-colors hover:bg-lumen active:scale-[0.97]"
              style={{ fontFamily: 'var(--font-mono)' }}
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
              className="rounded-full bg-pulse px-5 py-2 text-[13px] font-medium text-lumen transition-colors hover:bg-pulse/85 active:scale-[0.97]"
            >
              {withdraw.isPending ? 'Withdrawing…' : 'Withdraw'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
