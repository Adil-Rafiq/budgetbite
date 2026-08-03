import { TriangleAlert, RotateCw } from 'lucide-react';

import { FOCUS_RING } from '@/lib/focus-ring';

/**
 * Recoverable data-load failure. The product's core scene is a phone on mobile
 * data, where a dropped request is routine — so failures offer an in-place
 * retry (React Query's `refetch`) instead of dead-ending at "reload the app".
 */
export function DataError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-2xl border border-tomato/30 bg-tomato/[0.06] p-4 text-[13px] text-tomato-ink sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="flex items-center gap-3">
        <TriangleAlert aria-hidden className="h-4 w-4 shrink-0" />
        {message}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          // The house FOCUS_RING, not a bespoke tomato one. This is the single
          // control a keyboard user reaches during a failure; it should not be
          // the one control whose focus treatment they have never seen before.
          className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-tomato/40 bg-surface px-3 text-[12px] font-semibold text-tomato-ink transition-colors hover:bg-tomato/10 sm:min-h-9 sm:self-auto ${FOCUS_RING}`}
        >
          <RotateCw aria-hidden className="h-3.5 w-3.5" />
          Try again
        </button>
      )}
    </div>
  );
}
