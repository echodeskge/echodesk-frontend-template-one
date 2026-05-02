"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, ArrowRight, ShoppingBag } from "lucide-react";
import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";

/**
 * Landing page after a successful BOG card payment. The tenant
 * configures `https://<store>/payment/success` as `return_url_success`
 * in admin → Ecommerce; BOG redirects the customer here once 3-D
 * Secure clears.
 *
 * What we do:
 *   - Authenticated customers: send them to /account/orders so they
 *     can view the order they just paid for.
 *   - Guest customers: show a confirmation message + tell them to
 *     check their email for the receipt + tracking link (the BOG
 *     webhook fires the order-confirmation email once payment
 *     actually clears server-side).
 */

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();

  // BOG sometimes appends `?order_id=...` (its internal ID, not ours).
  // We don't use it directly — the order-confirmation email contains
  // the public token, and authenticated visitors can find the order
  // in /account/orders.
  const bogOrderId = searchParams.get("order_id");

  // Auto-redirect authenticated customers to their orders list — that
  // page lists the order they just paid for at the top.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/account/orders");
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <StoreLayout>
      <div className="container py-16">
        <Card className="mx-auto max-w-xl">
          <CardContent className="pt-12 pb-10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {t("paymentSuccess.title") || "Payment received"}
              </h1>
              <p className="mt-3 text-muted-foreground">
                {t("paymentSuccess.subtitle") ||
                  "Thank you — your payment has been confirmed."}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("paymentSuccess.emailNotice") ||
                "We've emailed you the order confirmation with a tracking link. The order is being prepared and will ship shortly."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              {isAuthenticated ? (
                <Button asChild size="lg" className="flex-1">
                  <Link href="/account/orders">
                    {t("paymentSuccess.viewOrders") || "View my orders"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="flex-1">
                  <Link href="/products">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    {t("paymentSuccess.keepShopping") || "Keep shopping"}
                  </Link>
                </Button>
              )}
              <Button asChild size="lg" variant="outline" className="flex-1">
                <Link href="/">
                  {t("paymentSuccess.home") || "Back to homepage"}
                </Link>
              </Button>
            </div>
            {bogOrderId && (
              <p className="text-xs text-muted-foreground pt-4">
                {t("paymentSuccess.bogReference") || "Bank reference"}: {bogOrderId}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </StoreLayout>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <StoreLayout>
          <div className="container py-16" />
        </StoreLayout>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
