"use client";

import { useEffect } from "react";
import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function WishlistError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Wishlist error:", error);
  }, [error]);

  return (
    <StoreLayout>
      <div className="container py-16 text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Something went wrong!</h1>
        <p className="mt-2 text-muted-foreground">
          We could not load your wishlist. Please try again.
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
