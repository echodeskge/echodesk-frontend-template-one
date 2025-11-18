import { StoreLayout } from "@/components/layout/store-layout";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Product detail loading UI
 */
export default function ProductDetailLoading() {
  return (
    <StoreLayout>
      <div className="container py-8">
        {/* Breadcrumb Skeleton */}
        <Skeleton className="mb-8 h-6 w-64" />

        {/* Product Details Skeleton */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Images Skeleton */}
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-20 rounded-md" />
              ))}
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 w-12" />
              <Skeleton className="h-12 w-12" />
            </div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="mt-12">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="mt-4 h-32 w-full" />
        </div>

        {/* Related Products Skeleton */}
        <div className="mt-16">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
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
