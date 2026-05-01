"use client";

/*
 * Voltage order-confirmation — bold receipt page that shows after a
 * successful order. Real `Order` data via `useOrder`. Renders a hero
 * banner + summary card + items + delivery + tracking when the
 * Voltage courier task has booked it.
 */

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { CheckCircle2, ArrowRight, Truck, Package } from "lucide-react";
import { useOrder } from "@/hooks/use-orders";
import { useLanguage } from "@/contexts/language-context";
import { Btn, Pill } from "../components";
import { useTranslate } from "../use-translate";

export function VoltageOrderConfirmationPage() {
  const t = useTranslate();
  const { getLocalizedValue } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const { data: order, isLoading, isError } = useOrder(orderId);

  useEffect(() => {
    if (!orderId) router.push("/");
  }, [orderId, router]);
  useEffect(() => {
    if (isError && !isLoading) router.push("/");
  }, [isError, isLoading, router]);

  const localized = (val: unknown): string => {
    if (typeof val === "string") return val;
    if (val && typeof val === "object") return getLocalizedValue(val as Record<string, string>);
    return "";
  };

  if (!orderId) return null;
  if (isLoading || !order) {
    return (
      <div style={{ padding: 80, textAlign: "center", opacity: 0.6 }}>
        {t("orderConfirmation.loading", "Loading order…")}
      </div>
    );
  }

  const total = Number(order.total_amount || 0);

  return (
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
          <Pill style={{ background: "var(--bg)", color: "var(--ink)" }}>
            #{order.order_number}
          </Pill>
          <h1
            className="display"
            style={{ fontSize: "clamp(48px, 7vw, 88px)", margin: 0 }}
          >
            {t("orderConfirmation.thankYou", "Thank you.")}
          </h1>
          <p style={{ fontSize: 16, maxWidth: 520, opacity: 0.85 }}>
            {t(
              "orderConfirmation.subcopy",
              "We've received your order and are getting it ready. Check your inbox — a confirmation email is on its way.",
            )}
          </p>
        </div>
      </section>

      {/* Body */}
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "32px 24px",
          display: "grid",
          gap: 16,
        }}
      >
        {/* Items */}
        <div
          style={{
            background: "var(--card)",
            border: "1.5px solid var(--line)",
            borderRadius: "var(--radius)",
            padding: 24,
          }}
        >
          <div
            className="display"
            style={{ fontSize: 28, marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <Package className="h-5 w-5" />
            {t("orderConfirmation.items", "Items")}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {(order.items || []).map((it) => {
              const name = localized(it.product_name);
              const subtotal = Number(it.subtotal || (Number(it.price || 0) * (it.quantity || 0)));
              return (
                <div
                  key={it.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px solid var(--line)",
                    fontSize: 14,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{name}</div>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>
                      ×{it.quantity}
                    </div>
                  </div>
                  <div className="display" style={{ fontSize: 18 }}>
                    {subtotal.toFixed(0)}₾
                  </div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginTop: 16,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700 }}>
              {t("cart.total", "Total")}
            </span>
            <span className="display" style={{ fontSize: 32 }}>
              {total.toFixed(0)}₾
            </span>
          </div>
        </div>

        {/* Delivery */}
        {order.delivery_address && (
          <div
            style={{
              background: "var(--card)",
              border: "1.5px solid var(--line)",
              borderRadius: "var(--radius)",
              padding: 24,
            }}
          >
            <div
              className="display"
              style={{ fontSize: 28, marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <Truck className="h-5 w-5" />
              {t("orderConfirmation.delivery", "Delivery")}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 600 }}>{order.delivery_address.label}</div>
              <div style={{ opacity: 0.8 }}>
                {order.delivery_address.address}, {order.delivery_address.city}
              </div>
            </div>
            {order.tracking_number && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: "var(--muted)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13,
                }}
              >
                <span style={{ opacity: 0.7 }}>
                  {t("account.tracking", "Tracking")}:
                </span>{" "}
                <span className="mono" style={{ fontWeight: 600 }}>
                  {order.tracking_number}
                </span>
                {order.courier_provider && (
                  <span style={{ opacity: 0.6 }}>
                    {" "}
                    · {order.courier_provider}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
          <Btn
            variant="ink"
            size="lg"
            iconRight={<ArrowRight className="h-5 w-5" />}
            onClick={() => router.push("/account")}
          >
            {t("orderConfirmation.viewAccount", "View my account")}
          </Btn>
          <Btn
            variant="outline"
            size="lg"
            onClick={() => router.push("/products")}
          >
            {t("orderConfirmation.keepShopping", "Keep shopping")}
          </Btn>
        </div>
      </section>
    </div>
  );
}
