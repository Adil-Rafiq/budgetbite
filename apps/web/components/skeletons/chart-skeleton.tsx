import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ChartSkeletonProps {
  variant: 'line' | 'bar' | 'pie' | 'area';
  className?: string;
}

const LINE_HEIGHTS = ['28%', '46%', '38%', '60%', '52%', '72%', '64%', '80%', '70%', '58%', '64%', '50%'];
const BAR_HEIGHTS_A = ['55%', '70%', '40%', '85%', '60%', '78%'];
const BAR_HEIGHTS_B = ['48%', '62%', '52%', '72%', '50%', '66%'];

export function ChartSkeleton({ variant, className }: ChartSkeletonProps) {
  if (variant === 'pie') {
    return (
      <div className={cn('flex h-full w-full flex-col items-center justify-center gap-3', className)}>
        <div className="relative">
          <Skeleton className="size-36 rounded-full" />
          <div className="bg-card absolute inset-0 m-auto size-16 rounded-full" />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Skeleton className="h-3 w-14 rounded-sm" />
          <Skeleton className="h-3 w-16 rounded-sm" />
          <Skeleton className="h-3 w-12 rounded-sm" />
        </div>
      </div>
    );
  }

  if (variant === 'bar') {
    return (
      <div className={cn('flex h-full w-full flex-col gap-2', className)}>
        <div className="flex flex-1 items-end justify-between gap-3 px-2">
          {BAR_HEIGHTS_A.map((h, i) => (
            <div key={i} className="flex h-full flex-1 items-end justify-center gap-1">
              <Skeleton className="w-3 rounded-sm" style={{ height: h }} />
              <Skeleton className="w-3 rounded-sm opacity-60" style={{ height: BAR_HEIGHTS_B[i] }} />
            </div>
          ))}
        </div>
        <Skeleton className="h-px w-full rounded-none" />
      </div>
    );
  }

  // line / area
  return (
    <div className={cn('relative flex h-full w-full flex-col gap-2', className)}>
      <div className="relative flex flex-1 items-end justify-between gap-1 px-1">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton
            key={`grid-${i}`}
            className="absolute left-0 right-0 h-px rounded-none opacity-40"
            style={{ bottom: `${(i + 1) * 20}%` }}
          />
        ))}
        {LINE_HEIGHTS.map((h, i) => (
          <div key={i} className="relative flex h-full flex-1 items-end justify-center">
            {variant === 'area' && (
              <Skeleton
                className="absolute bottom-0 left-0 right-0 rounded-none opacity-40"
                style={{ height: h }}
              />
            )}
            <Skeleton className="size-2 rounded-full" style={{ marginBottom: h }} />
          </div>
        ))}
      </div>
      <Skeleton className="h-px w-full rounded-none" />
    </div>
  );
}
