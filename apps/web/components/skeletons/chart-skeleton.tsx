import { cn } from '@/lib/utils';

interface ChartSkeletonProps {
  variant: 'line' | 'bar' | 'pie' | 'area';
  className?: string;
}

const LINE_HEIGHTS = [
  '28%',
  '46%',
  '38%',
  '60%',
  '52%',
  '72%',
  '64%',
  '80%',
  '70%',
  '58%',
  '64%',
  '50%',
];
const BAR_HEIGHTS_A = ['55%', '70%', '40%', '85%', '60%', '78%'];
const BAR_HEIGHTS_B = ['48%', '62%', '52%', '72%', '50%', '66%'];

const shimmerCls = 'animate-pulse rounded';

export function ChartSkeleton({ variant, className }: ChartSkeletonProps) {
  if (variant === 'pie') {
    return (
      <div
        className={cn(
          'flex h-full w-full flex-col items-center justify-center gap-3',
          className,
        )}
      >
        <div className="relative">
          <div className="size-36 animate-pulse rounded-full bg-lumen" />
          <div className="absolute inset-0 m-auto size-16 rounded-full bg-white" />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <div className={cn(shimmerCls, 'h-3 w-14 bg-lumen')} />
          <div className={cn(shimmerCls, 'h-3 w-16 bg-lumen')} />
          <div className={cn(shimmerCls, 'h-3 w-12 bg-lumen')} />
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
              <div
                className="w-3 animate-pulse rounded-sm bg-lumen"
                style={{ height: h }}
              />
              <div
                className="w-3 animate-pulse rounded-sm bg-lumen-dk opacity-60"
                style={{ height: BAR_HEIGHTS_B[i] }}
              />
            </div>
          ))}
        </div>
        <div className="h-px w-full bg-lumen-dk" />
      </div>
    );
  }

  return (
    <div className={cn('relative flex h-full w-full flex-col gap-2', className)}>
      <div className="relative flex flex-1 items-end justify-between gap-1 px-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={`grid-${i}`}
            className="absolute left-0 right-0 h-px bg-lumen-dk opacity-50"
            style={{ bottom: `${(i + 1) * 20}%` }}
          />
        ))}
        {LINE_HEIGHTS.map((h, i) => (
          <div key={i} className="relative flex h-full flex-1 items-end justify-center">
            {variant === 'area' && (
              <div
                className="absolute bottom-0 left-0 right-0 animate-pulse bg-lumen opacity-60"
                style={{ height: h }}
              />
            )}
            <div
              className="size-2 animate-pulse rounded-full bg-lumen-dk"
              style={{ marginBottom: h }}
            />
          </div>
        ))}
      </div>
      <div className="h-px w-full bg-lumen-dk" />
    </div>
  );
}
