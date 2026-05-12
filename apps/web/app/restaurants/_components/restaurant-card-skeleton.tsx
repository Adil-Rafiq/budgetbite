import { cn } from '@/lib/utils';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const WHITE = '#ffffff';

interface RestaurantCardSkeletonProps {
  className?: string;
}

export function RestaurantCardSkeleton({ className }: RestaurantCardSkeletonProps) {
  return (
    <div
      className={cn('flex h-full flex-col rounded-2xl p-5', className)}
      style={{
        background: WHITE,
        border: `1px solid ${LUMEN_DK}`,
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="h-3 w-10 animate-pulse rounded" style={{ background: LUMEN }} />
        <div className="flex shrink-0 items-center gap-1">
          <div className="h-3.5 w-3.5 animate-pulse rounded" style={{ background: LUMEN }} />
          <div className="h-4 w-7 animate-pulse rounded" style={{ background: LUMEN }} />
        </div>
      </div>
      <div className="mt-3 h-5 w-32 animate-pulse rounded" style={{ background: LUMEN }} />
      <div className="mt-2 flex items-center gap-3">
        <div className="h-3 w-16 animate-pulse rounded" style={{ background: LUMEN }} />
        <div className="h-3 w-12 animate-pulse rounded" style={{ background: LUMEN }} />
      </div>
      <div className="mt-auto flex items-end justify-between pt-4">
        <div className="h-6 w-20 animate-pulse rounded" style={{ background: LUMEN }} />
        <div className="h-3 w-16 animate-pulse rounded" style={{ background: LUMEN }} />
      </div>
    </div>
  );
}
