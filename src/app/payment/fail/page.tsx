"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { XCircle, RefreshCw, ShoppingCart } from "lucide-react";
import { StoreLayout } from "@/components/layout/store-layout";
import { useTranslate } from "@/templates/voltage/use-translate";
import { Btn, Pill } from "@/templates/voltage/components";

/**
 * Landing page after a failed / cancelled BOG card payment. Voltage
 * style. The cart is still preserved server-side; sending the
 * customer back to /cart or /checkout lets them retry.
 */

function PaymentFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslate();
  const bogOrderId = searchParams.get("order_id");

  return (
    <StoreLayout>
      <div className="page-enter">
        <section
          style={{
            background: "var(--ink)",
            color: "var(--bg)",
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
              <XCircle className="h-9 w-9" />
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
              {t("paymentFail.title", "Payment didn't go through.")}
            </h1>
            <p style={{ fontSize: 16, maxWidth: 540, opacity: 0.85 }}>
              {t(
                "paymentFail.subtitle",
                "The bank declined or you cancelled the payment. No money was charged — your cart is still saved.",
              )}
            </p>
          </div>
        </section>

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
            <div className="display" style={{ fontSize: 24, marginBottom: 8 }}>
              {t("paymentFail.tryAgainTitle", "Want to try again?")}
            </div>
            <p style={{ fontSize: 14, opacity: 0.75, lineHeight: 1.6 }}>
              {t(
                "paymentFail.tryAgainHint",
                "Head back to the cart and re-enter card details. If it keeps failing, try a different card or pick cash on delivery if you switch to pickup.",
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
            <Btn
              variant="ink"
              size="lg"
              iconRight={<RefreshCw className="h-5 w-5" />}
              onClick={() => router.push("/checkout")}
            >
              {t("paymentFail.retry", "Try checkout again")}
            </Btn>
            <Btn
              variant="outline"
              size="lg"
              iconRight={<ShoppingCart className="h-5 w-5" />}
              onClick={() => router.push("/cart")}
            >
              {t("paymentFail.backToCart", "Back to cart")}
            </Btn>
          </div>

          {bogOrderId && (
            <div style={{ fontSize: 12, opacity: 0.5 }}>
              {t("paymentFail.bogReference", "Bank reference")}: {bogOrderId}
            </div>
          )}
        </section>
      </div>
    </StoreLayout>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense
      fallback={
        <StoreLayout>
          <div className="page-enter" style={{ padding: 64 }} />
        </StoreLayout>
      }
    >
      <PaymentFailContent />
    </Suspense>
  );
}
