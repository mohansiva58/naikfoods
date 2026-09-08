import { Skeleton } from './ui/skeleton';

interface ProductCardSkeletonProps {
  index?: number;
}

export function ProductCardSkeleton({ index = 0 }: ProductCardSkeletonProps) {
  return (
    <div className="group">
      <div
        className="
          overflow-hidden
          rounded-[28px]
          border
          border-neutral-200
          bg-white
        "
      >
        {/* Image Skeleton */}
        <Skeleton className="aspect-[3/3.6] w-full bg-neutral-100" />

        {/* Info Skeleton */}
        <div className="space-y-3 p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
