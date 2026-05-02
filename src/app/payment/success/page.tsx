"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, ShoppingBag } from "lucide-react";
import { StoreLayout } from "@/components/layout/store-layout";
import { useAuth } from "@/contexts/auth-context";
import { useTranslate } from "@/templates/voltage/use-translate";
import { Btn, Pill } from "@/templates/voltage/components";

/**
 * Landing page after a successful BOG card payment. The tenant
 * configures `https://<store>/payment/success` as `return_url_success`
 * in admin → Ecommerce; BOG redirects the customer here once 3-D
 * Secure clears.
 *
 * Voltage-styled to match the order-confirmation receipt — same
 * yellow hero strip + dark wordmark + bold buttons. Authenticated
 * visitors get auto-redirected to /account/orders so they see the
 * order they just paid for; guests land on this page since their
 * proper receipt link is in the email the BOG webhook sends.
 */

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const t = useTranslate();

  // BOG appends `?order_id=...` (its internal ID, not ours) on the
  // return URL. We don't use it directly — the order-confirmation
  // email contains the public token, and authenticated visitors find
  // the order in /account/orders.
  const bogOrderId = searchParams.get("order_id");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/account/orders");
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <StoreLayout>
      <div className="page-enter">
        {/* Hero confirmation strip */}
        <section
          style={{
            background: "var(--accent)",
            color: "var(--accent-ink)",
            borderBottom: "1.5px solid var(--ink)",
          }}
        >
          <div
            style={{
              maxWidth: 1440,
              margin: "0 auto",
              padding: "48px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 999,
                background: "var(--bg)",
                color: "var(--ink)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <CheckCircle2 className="h-9 w-9" />
            </div>
            {bogOrderId && (
              <Pill style={{ background: "var(--bg)", color: "var(--ink)" }}>
                #{bogOrderId}
              </Pill>
            )}
            <h1
              className="display"
              style={{ fontSize: "clamp(48px, 7vw, 88px)", margin: 0 }}
            >
              {t("paymentSuccess.title", "Payment received.")}
            </h1>
            <p style={{ fontSize: 16, maxWidth: 540, opacity: 0.85 }}>
              {t(
                "paymentSuccess.subtitle",
                "Thank you — your card payment cleared. We've emailed your receipt and tracking link.",
              )}
            </p>
          </div>
        </section>

        {/* Body */}
        <section
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "40px 24px",
            display: "grid",
            gap: 20,
            textAlign: "center",
          }}
        >
          <div
            style={{
              padding: 28,
              background: "var(--card)",
              border: "1.5px solid var(--line)",
              borderRadius: "var(--radius)",
            }}
          >
            <div
              className="display"
              style={{ fontSize: 24, marginBottom: 8 }}
            >
              {t("paymentSuccess.whatsNext", "What's next?")}
            </div>
            <p style={{ fontSize: 14, opacity: 0.75, lineHeight: 1.6 }}>
              {t(
                "paymentSuccess.emailNotice",
                "Check your inbox for the order confirmation. We're packing it up and a courier will pick it up shortly. You can track delivery from the link in the email.",
              )}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {isAuthenticated ? (
              <Btn
                variant="ink"
                size="lg"
                iconRight={<ArrowRight className="h-5 w-5" />}
                onClick={() => router.push("/account/orders")}
              >
                {t("paymentSuccess.viewOrders", "View my orders")}
              </Btn>
            ) : (
              <Btn
                variant="ink"
                size="lg"
                iconRight={<ShoppingBag className="h-5 w-5" />}
                onClick={() => router.push("/products")}
              >
                {t("paymentSuccess.keepShopping", "Keep shopping")}
              </Btn>
            )}
            <Btn
              variant="outline"
              size="lg"
              onClick={() => router.push("/")}
            >
              {t("paymentSuccess.home", "Back to homepage")}
            </Btn>
          </div>

          <Link
            href="/"
            style={{
              fontSize: 12,
              opacity: 0.5,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            {bogOrderId
              ? `${t("paymentSuccess.bogReference", "Bank reference")}: ${bogOrderId}`
              : ""}
          </Link>
        </section>
      </div>
    </StoreLayout>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <StoreLayout>
          <div className="page-enter" style={{ padding: 64 }} />
        </StoreLayout>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
