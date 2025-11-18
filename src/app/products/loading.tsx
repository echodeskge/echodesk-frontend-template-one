import { StoreLayout } from "@/components/layout/store-layout";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Products list loading UI
 */
export default function ProductsLoading() {
  return (
    <StoreLayout>
      <div className="container py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="mt-8 grid gap-8 md:grid-cols-[240px_1fr]">
          {/* Filters Skeleton */}
          <div className="hidden md:block">
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>

          {/* Products Grid Skeleton */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
