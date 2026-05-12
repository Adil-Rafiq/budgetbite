import { cn } from '@/lib/utils';

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
          className={cn(
            'w-full overflow-hidden rounded-2xl border border-lumen-dk bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]',
            cardClassName,
          )}
        >
          <div className="h-3 w-12 animate-pulse rounded bg-lumen" />
          <div className="mt-3 h-5 w-32 animate-pulse rounded bg-lumen" />
          <div className="mt-2 h-3 w-24 animate-pulse rounded bg-lumen" />
        </div>
      ))}
    </div>
  );
}
