"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle, RefreshCw, ShoppingCart } from "lucide-react";
import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";

/**
 * Landing page after a failed / cancelled BOG card payment. The
 * tenant configures `https://<store>/payment/fail` as
 * `return_url_fail` in admin; BOG redirects the customer here when
 * the payment gets declined or the customer cancels at the 3-D
 * Secure page.
 *
 * The cart is preserved (the order was created server-side but
 * payment_status is still `pending` / failed), so we send the
 * customer back to /cart to retry.
 */

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const bogOrderId = searchParams.get("order_id");

  return (
    <StoreLayout>
      <div className="container py-16">
        <Card className="mx-auto max-w-xl">
          <CardContent className="pt-12 pb-10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {t("paymentFail.title") || "Payment didn't go through"}
              </h1>
              <p className="mt-3 text-muted-foreground">
                {t("paymentFail.subtitle") ||
                  "The bank declined or cancelled the payment. No money was charged."}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("paymentFail.retry") ||
                "Your cart is still saved. Head back and try again — or pick a different card."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild size="lg" className="flex-1">
                <Link href="/cart">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {t("paymentFail.backToCart") || "Back to cart"}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="flex-1">
                <Link href="/checkout">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t("paymentFail.retry") || "Try checkout again"}
                </Link>
              </Button>
            </div>
            {bogOrderId && (
              <p className="text-xs text-muted-foreground pt-4">
                {t("paymentFail.bogReference") || "Bank reference"}: {bogOrderId}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </StoreLayout>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense
      fallback={
        <StoreLayout>
          <div className="container py-16" />
        </StoreLayout>
      }
    >
      <PaymentFailContent />
    </Suspense>
  );
}
