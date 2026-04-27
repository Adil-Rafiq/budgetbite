import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface MenuItemSkeletonProps {
  className?: string;
}

export function MenuItemSkeleton({ className }: MenuItemSkeletonProps) {
  return (
    <Card className={cn('border-border', className)}>
      <CardContent className="flex items-start justify-between gap-4 pt-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-32 rounded-sm" />
          <Skeleton className="h-3 w-full rounded-sm" />
          <Skeleton className="h-3 w-3/4 rounded-sm" />
        </div>
        <Skeleton className="h-4 w-16 shrink-0 rounded-sm" />
      </CardContent>
    </Card>
  );
}
