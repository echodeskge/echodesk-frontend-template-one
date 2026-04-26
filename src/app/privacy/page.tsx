import { Metadata } from "next";
import { StoreLayout } from "@/components/layout/store-layout";
import { StructuredData } from "@/components/structured-data";
import { generatePageMetadata, generateBreadcrumbSchema } from "@/lib/seo";
import { getTenantBaseUrl } from "@/lib/tenant-url";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: "Privacy Policy",
    description:
      "Learn how we collect, use, and protect your personal information.",
    path: "/privacy",
    keywords: ["privacy policy", "privacy", "data protection"],
  });
}

export default async function PrivacyPage() {
  const baseUrl = await getTenantBaseUrl();

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Privacy Policy", url: `${baseUrl}/privacy` },
  ]);

  return (
    <>
      <StructuredData data={breadcrumbSchema} />
      <StoreLayout>
        <div className="container py-16 max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          <div className="prose prose-gray max-w-none">
            <p className="text-muted-foreground">
              This privacy policy will be customized by the store owner. Please
              contact us for more information about how your data is handled.
            </p>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}
