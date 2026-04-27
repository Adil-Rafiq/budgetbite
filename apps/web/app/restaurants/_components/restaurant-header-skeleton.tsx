import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface RestaurantHeaderSkeletonProps {
  className?: string;
}

export function RestaurantHeaderSkeleton({ className }: RestaurantHeaderSkeletonProps) {
  return (
    <Card className={cn('border-border', className)}>
      <CardHeader>
        <Skeleton className="h-7 w-48 rounded-sm" />
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-1">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="h-4 w-10 rounded-sm" />
          <Skeleton className="h-4 w-12 rounded-sm" />
        </div>
        <Skeleton className="h-4 w-24 rounded-sm" />
        <Skeleton className="h-4 w-28 rounded-sm" />
      </CardContent>
    </Card>
  );
}
