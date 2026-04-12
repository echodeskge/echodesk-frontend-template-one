import { StoreLayout } from "@/components/layout/store-layout";

export default function ShippingPage() {
  return (
    <StoreLayout>
      <div className="container py-16 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Shipping Information</h1>
        <div className="prose prose-gray max-w-none">
          <p className="text-muted-foreground">
            Shipping information will be customized by the store owner.
            Please contact us for details about shipping options and delivery times.
          </p>
        </div>
      </div>
    </StoreLayout>
  );
}
