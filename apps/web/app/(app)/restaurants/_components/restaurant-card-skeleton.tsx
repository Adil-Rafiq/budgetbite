import { cn } from '@/lib/utils';

interface RestaurantCardSkeletonProps {
  className?: string;
}

export function RestaurantCardSkeleton({ className }: RestaurantCardSkeletonProps) {
  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-2xl border border-sand bg-white p-5 shadow-sm',
        className,
      )}
    >
      {/* Mirrors the real card: thumbnail, name, rating right, price block last. */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-sand" />
          <div className="mt-1 h-5 w-32 animate-pulse rounded bg-sand" />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <div className="h-3.5 w-3.5 animate-pulse rounded bg-sand" />
          <div className="h-4 w-7 animate-pulse rounded bg-sand" />
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-3">
        <div className="h-3 w-14 animate-pulse rounded bg-sand" />
        <div className="h-3 w-20 animate-pulse rounded bg-sand" />
      </div>
      <div className="mt-auto flex flex-col gap-2 pt-4">
        <div className="h-4 w-24 animate-pulse rounded-full bg-sand" />
        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            <div className="h-2.5 w-16 animate-pulse rounded bg-sand" />
            <div className="h-5 w-20 animate-pulse rounded bg-sand" />
            <div className="h-2.5 w-24 animate-pulse rounded bg-sand" />
          </div>
          <div className="h-3 w-16 animate-pulse rounded bg-sand" />
        </div>
      </div>
    </div>
  );
}
