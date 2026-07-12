import { cn } from '@/lib/utils';

interface RestaurantHeaderSkeletonProps {
  className?: string;
}

export function RestaurantHeaderSkeleton({ className }: RestaurantHeaderSkeletonProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-sage bg-white p-5 shadow-sm',
        className,
      )}
    >
      <div className="h-3 w-20 animate-pulse rounded bg-sage" />
      <div className="mt-2 h-8 w-48 animate-pulse rounded bg-sage" />
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-1">
          <div className="h-4 w-4 animate-pulse rounded bg-sage" />
          <div className="h-4 w-10 animate-pulse rounded bg-sage" />
        </div>
        <div className="h-4 w-24 animate-pulse rounded bg-sage" />
        <div className="h-4 w-28 animate-pulse rounded bg-sage" />
      </div>
    </div>
  );
}
