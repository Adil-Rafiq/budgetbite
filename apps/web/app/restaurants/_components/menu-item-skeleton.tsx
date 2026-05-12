import { cn } from '@/lib/utils';

interface MenuItemSkeletonProps {
  className?: string;
}

export function MenuItemSkeleton({ className }: MenuItemSkeletonProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-lumen-dk bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]',
        className,
      )}
    >
      <div className="h-32 w-full animate-pulse bg-lumen" />
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="h-4 w-32 animate-pulse rounded bg-lumen" />
          <div className="h-3 w-full animate-pulse rounded bg-lumen" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-lumen" />
        </div>
        <div className="h-4 w-16 shrink-0 animate-pulse rounded bg-lumen" />
      </div>
    </div>
  );
}
