import { StoreLayout } from "@/components/layout/store-layout";

export default function ReturnsPage() {
  return (
    <StoreLayout>
      <div className="container py-16 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Returns & Refunds</h1>
        <div className="prose prose-gray max-w-none">
          <p className="text-muted-foreground">
            The returns and refunds policy will be customized by the store owner.
            Please contact us for more information about returns and refunds.
          </p>
        </div>
      </div>
    </StoreLayout>
  );
}
