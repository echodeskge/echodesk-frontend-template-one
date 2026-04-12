import { Metadata } from "next";
import { StoreLayout } from "@/components/layout/store-layout";
import { StructuredData } from "@/components/structured-data";
import {
  generatePageMetadata,
  generateBreadcrumbSchema,
  generateFAQSchema,
} from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: "Frequently Asked Questions",
    description:
      "Find answers to common questions about orders, payments, shipping, and returns.",
    path: "/faq",
    keywords: ["FAQ", "help", "questions", "support"],
  });
}

const faqItems = [
  {
    question: "How do I place an order?",
    answer: "Browse products, add to cart, and checkout.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept card payments and cash on delivery.",
  },
  {
    question: "How can I track my order?",
    answer: "Log in to your account and visit My Orders.",
  },
  {
    question: "What is your return policy?",
    answer: "We accept returns within 14 days of delivery.",
  },
];

export default function FaqPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourstore.com";

  const faqSchema = generateFAQSchema(faqItems);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "FAQ", url: `${baseUrl}/faq` },
  ]);

  return (
    <>
      <StructuredData data={faqSchema} />
      <StructuredData data={breadcrumbSchema} />
      <StoreLayout>
        <div className="container py-16 max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">
            Frequently Asked Questions
          </h1>
          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b pb-4 last:border-b-0">
                <h2 className="text-lg font-semibold mb-2">{item.question}</h2>
                <p className="text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-muted-foreground">
            Frequently asked questions will be customized by the store owner.
            Please contact us if you have any questions.
          </p>
        </div>
      </StoreLayout>
    </>
  );
}
