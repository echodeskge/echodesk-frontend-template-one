"use client";

import { useEffect } from "react";
import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

/**
 * Root error boundary
 * Catches errors during rendering and displays fallback UI
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <StoreLayout>
      <div className="container py-16 text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Something went wrong!</h1>
        <p className="mt-2 text-muted-foreground">
          We apologize for the inconvenience. An error occurred while loading this
          page.
        </p>
        {error.message && (
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        )}
        <div className="mt-6 flex justify-center gap-4">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Go home
          </Button>
        </div>
      </div>
    </StoreLayout>
  );
}
