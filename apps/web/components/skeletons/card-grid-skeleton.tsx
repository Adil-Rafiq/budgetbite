import { cn } from '@/lib/utils';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const WHITE = '#ffffff';

interface CardGridSkeletonProps {
  cards?: number;
  columns?: 1 | 2 | 3 | 4;
  cardClassName?: string;
  className?: string;
}

const COLUMN_CLASSES: Record<1 | 2 | 3 | 4, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export function CardGridSkeleton({
  cards = 6,
  columns = 3,
  cardClassName = 'h-36',
  className,
}: CardGridSkeletonProps) {
  return (
    <div className={cn('grid gap-4', COLUMN_CLASSES[columns], className)}>
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className={cn('w-full overflow-hidden rounded-2xl p-5', cardClassName)}
          style={{
            background: WHITE,
            border: `1px solid ${LUMEN_DK}`,
            boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
          }}
        >
          <div className="h-3 w-12 animate-pulse rounded" style={{ background: LUMEN }} />
          <div className="mt-3 h-5 w-32 animate-pulse rounded" style={{ background: LUMEN }} />
          <div className="mt-2 h-3 w-24 animate-pulse rounded" style={{ background: LUMEN }} />
        </div>
      ))}
    </div>
  );
}
