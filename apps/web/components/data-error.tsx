import { TriangleAlert, RotateCw } from 'lucide-react';

/**
 * Recoverable data-load failure. The product's core scene is a phone on mobile
 * data, where a dropped request is routine — so failures offer an in-place
 * retry (React Query's `refetch`) instead of dead-ending at "reload the app".
 */
export function DataError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-tomato/30 bg-tomato/[0.06] p-4 text-[13px] text-tomato sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-center gap-3">
        <TriangleAlert className="h-4 w-4 shrink-0" />
        {message}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-tomato/40 bg-white px-3 py-1.5 text-[12px] font-semibold text-tomato transition-colors hover:bg-tomato/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:self-auto"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Try again
        </button>
      )}
    </div>
  );
}
