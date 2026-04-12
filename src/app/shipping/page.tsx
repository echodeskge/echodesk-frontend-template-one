import { Metadata } from "next";
import { StoreLayout } from "@/components/layout/store-layout";
import { StructuredData } from "@/components/structured-data";
import { generatePageMetadata, generateBreadcrumbSchema } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: "Shipping Information",
    description:
      "Learn about our shipping options, delivery times, and shipping costs.",
    path: "/shipping",
    keywords: ["shipping", "delivery", "shipping policy"],
  });
}

export default function ShippingPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourstore.com";

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Shipping Information", url: `${baseUrl}/shipping` },
  ]);

  return (
    <>
      <StructuredData data={breadcrumbSchema} />
      <StoreLayout>
        <div className="container py-16 max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Shipping Information</h1>
          <div className="prose prose-gray max-w-none">
            <p className="text-muted-foreground">
              Shipping information will be customized by the store owner. Please
              contact us for details about shipping options and delivery times.
            </p>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}
