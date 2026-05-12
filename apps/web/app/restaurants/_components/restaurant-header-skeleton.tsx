import { cn } from '@/lib/utils';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const WHITE = '#ffffff';

interface RestaurantHeaderSkeletonProps {
  className?: string;
}

export function RestaurantHeaderSkeleton({ className }: RestaurantHeaderSkeletonProps) {
  return (
    <div
      className={cn('overflow-hidden rounded-2xl p-5', className)}
      style={{
        background: WHITE,
        border: `1px solid ${LUMEN_DK}`,
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
      }}
    >
      <div className="h-3 w-20 animate-pulse rounded" style={{ background: LUMEN }} />
      <div className="mt-2 h-8 w-48 animate-pulse rounded" style={{ background: LUMEN }} />
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-1">
          <div className="h-4 w-4 animate-pulse rounded" style={{ background: LUMEN }} />
          <div className="h-4 w-10 animate-pulse rounded" style={{ background: LUMEN }} />
        </div>
        <div className="h-4 w-24 animate-pulse rounded" style={{ background: LUMEN }} />
        <div className="h-4 w-28 animate-pulse rounded" style={{ background: LUMEN }} />
      </div>
    </div>
  );
}
