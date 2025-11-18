import { StoreLayout } from "@/components/layout/store-layout";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Root loading UI
 * Shown during page transitions and initial load
 */
export default function Loading() {
  return (
    <StoreLayout>
      <div className="container py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </StoreLayout>
  );
}
