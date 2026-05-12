import { cn } from '@/lib/utils';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const WHITE = '#ffffff';

interface MenuItemSkeletonProps {
  className?: string;
}

export function MenuItemSkeleton({ className }: MenuItemSkeletonProps) {
  return (
    <div
      className={cn('overflow-hidden rounded-2xl', className)}
      style={{
        background: WHITE,
        border: `1px solid ${LUMEN_DK}`,
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
      }}
    >
      <div className="h-32 w-full animate-pulse" style={{ background: LUMEN }} />
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="h-4 w-32 animate-pulse rounded" style={{ background: LUMEN }} />
          <div className="h-3 w-full animate-pulse rounded" style={{ background: LUMEN }} />
          <div className="h-3 w-3/4 animate-pulse rounded" style={{ background: LUMEN }} />
        </div>
        <div className="h-4 w-16 shrink-0 animate-pulse rounded" style={{ background: LUMEN }} />
      </div>
    </div>
  );
}
