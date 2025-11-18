import { Metadata } from "next";
import Link from "next/link";
import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

/**
 * Custom 404 page metadata
 */
export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for could not be found.",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Custom 404 Not Found page
 */
export default function NotFound() {
  return (
    <StoreLayout>
      <div className="container py-16 text-center">
        <FileQuestion className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="mt-4 text-4xl font-bold">404</h1>
        <h2 className="mt-2 text-2xl font-semibold">Page Not Found</h2>
        <p className="mt-2 text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Button asChild>
            <Link href="/">Go to Homepage</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    </StoreLayout>
  );
}
