import { Metadata } from "next";
import { StoreLayout } from "@/components/layout/store-layout";
import { StructuredData } from "@/components/structured-data";
import { generatePageMetadata, generateBreadcrumbSchema } from "@/lib/seo";
import { getTenantBaseUrl } from "@/lib/tenant-url";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: "Returns & Refunds",
    description:
      "Learn about our return policy, refund process, and how to initiate a return.",
    path: "/returns",
    keywords: ["returns", "refunds", "return policy"],
  });
}

export default async function ReturnsPage() {
  const baseUrl = await getTenantBaseUrl();

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Returns & Refunds", url: `${baseUrl}/returns` },
  ]);

  return (
    <>
      <StructuredData data={breadcrumbSchema} />
      <StoreLayout>
        <div className="container py-16 max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Returns & Refunds</h1>
          <div className="prose prose-gray max-w-none">
            <p className="text-muted-foreground">
              The returns and refunds policy will be customized by the store
              owner. Please contact us for more information about returns and
              refunds.
            </p>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}
