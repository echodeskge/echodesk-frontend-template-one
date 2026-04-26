import { Metadata } from "next";
import { StoreLayout } from "@/components/layout/store-layout";
import { StructuredData } from "@/components/structured-data";
import { generatePageMetadata, generateBreadcrumbSchema } from "@/lib/seo";
import { getTenantBaseUrl } from "@/lib/tenant-url";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: "Terms of Service",
    description:
      "Read our terms of service to understand the rules and guidelines for using our store.",
    path: "/terms",
    keywords: ["terms of service", "terms", "legal"],
  });
}

export default async function TermsPage() {
  const baseUrl = await getTenantBaseUrl();

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Terms of Service", url: `${baseUrl}/terms` },
  ]);

  return (
    <>
      <StructuredData data={breadcrumbSchema} />
      <StoreLayout>
        <div className="container py-16 max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
          <div className="prose prose-gray max-w-none">
            <p className="text-muted-foreground">
              These terms of service will be customized by the store owner.
              Please contact us for more information.
            </p>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}
