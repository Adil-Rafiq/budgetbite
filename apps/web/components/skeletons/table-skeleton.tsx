import { cn } from '@/lib/utils';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

const COLUMN_WIDTHS = ['w-16', 'w-20', 'w-32', 'w-14'];

export function TableSkeleton({ rows = 5, columns = 4, className }: TableSkeletonProps) {
  const widths = (i: number) => COLUMN_WIDTHS[i % COLUMN_WIDTHS.length];

  return (
    <div
      className={cn('flex w-full flex-col gap-3', className)}
      role="status"
      aria-label="Loading"
    >
      <div className="flex items-center gap-4 border-b border-lumen-dk pb-2">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className={cn('flex-1', i === columns - 1 && 'flex justify-end')}>
            <div className={cn('h-3 animate-pulse rounded bg-lumen', widths(i))} />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4">
          {Array.from({ length: columns }).map((_, c) => (
            <div key={c} className={cn('flex-1', c === columns - 1 && 'flex justify-end')}>
              <div className={cn('h-4 animate-pulse rounded bg-lumen', widths(c))} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
