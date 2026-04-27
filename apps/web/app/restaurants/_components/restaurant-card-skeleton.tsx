import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface RestaurantCardSkeletonProps {
  className?: string;
}

export function RestaurantCardSkeleton({ className }: RestaurantCardSkeletonProps) {
  return (
    <Card className={cn('border-border h-full', className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-5 w-32 rounded-sm" />
          <div className="flex shrink-0 items-center gap-1">
            <Skeleton className="size-3.5 rounded-sm" />
            <Skeleton className="h-4 w-7 rounded-sm" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-20 rounded-sm" />
          <Skeleton className="h-3 w-16 rounded-sm" />
        </div>
        <Skeleton className="h-3 w-28 rounded-sm" />
      </CardContent>
    </Card>
  );
}
