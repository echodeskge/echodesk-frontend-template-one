import { StoreLayout } from "@/components/layout/store-layout";

export default function FaqPage() {
  return (
    <StoreLayout>
      <div className="container py-16 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>
        <div className="prose prose-gray max-w-none">
          <p className="text-muted-foreground">
            Frequently asked questions will be customized by the store owner.
            Please contact us if you have any questions.
          </p>
        </div>
      </div>
    </StoreLayout>
  );
}
