"use client";

/*
 * Voltage cart page — bold layout split into items + sticky summary.
 * Ported from `templates/echodesk/pages/cart.jsx`. Real backend
 * data via `useCartItems`, `useUpdateCartItem`, `useRemoveFromCart`.
 */

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useCartItems, useUpdateCartItem, useRemoveFromCart } from "@/hooks/use-cart";
import { useHydratedGuestCart, useGuestCartMutations } from "@/hooks/use-guest-cart";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useTranslate } from "../use-translate";
import { Btn } from "../components";

export function VoltageCartPage() {
  const router = useRouter();
  const t = useTranslate();
  const { getLocalizedValue } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { data: cartData, isLoading: backendLoading } = useCartItems();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();
  const guestCart = useHydratedGuestCart();
  const guestMutations = useGuestCartMutations();

  // Branch on auth state. The two branches normalise to the same shape
  // so the rest of the component renders one tree.
  const items = isAuthenticated
    ? (cartData?.results ?? []).map((it) => ({
        id: String(it.id),
        product_id: it.product?.id ?? 0,
        product_name: it.product?.name,
        product_image: it.product?.image ?? null,
        quantity: it.quantity || 0,
        price: Number(it.price_at_add || 0),
        subtotal: Number(it.price_at_add || 0) * (it.quantity || 0),
      }))
    : guestCart.items.map((it) => ({
        id: it.id,
        product_id: it.product_id,
        product_name: it.name,
        product_image: it.image,
        quantity: it.quantity,
        price: it.price,
        subtotal: it.subtotal,
      }));
  const isLoading = isAuthenticated ? backendLoading : guestCart.isLoading;
  const subtotal = items.reduce((s, it) => s + it.subtotal, 0);
  // Cart is pre-checkout — we don't know the delivery method or address
  // yet, and Georgian retail prices already include 18% VAT, so don't
  // fabricate a "Tax" line. Shipping shows as "Calculated at checkout"
  // and the total mirrors the subtotal until the visitor picks an
  // address + courier on /checkout.
  const total = subtotal;

  const localized = (val: unknown): string => {
    if (typeof val === "string") return val;
    if (val && typeof val === "object") return getLocalizedValue(val as Record<string, string>);
    return "";
  };

  const updateQty = (rowId: string, productId: number, qty: number) => {
    if (qty < 1) return;
    if (isAuthenticated) {
      updateItem.mutate({ id: rowId, data: { quantity: qty } });
    } else {
      guestMutations.setQuantity(productId, qty);
    }
  };

  const removeRow = (rowId: string, productId: number) => {
    if (isAuthenticated) {
      removeItem.mutate(rowId);
    } else {
      guestMutations.removeItem(productId);
    }
  };

  return (
    <div className="page-enter">
      <section style={{ maxWidth: 1440, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.6, marginBottom: 8 }}>
          <Link href="/" style={{ color: "inherit" }}>
            {t("nav.home", "Home")}
          </Link>{" "}
          / <strong>{t("cart.title", "Cart")}</strong>
        </div>
        <h1 className="display" style={{ fontSize: "clamp(48px, 7vw, 96px)", margin: "8px 0 32px" }}>
          {t("cart.heading", "Your bag.")}
        </h1>

        {isLoading ? (
          <div style={{ padding: 80, textAlign: "center", opacity: 0.6 }}>
            {t("cart.loading", "Loading…")}
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: 80,
              textAlign: "center",
              border: "1.5px dashed var(--line)",
              borderRadius: "var(--radius)",
            }}
          >
            <ShoppingCart className="h-12 w-12 mx-auto" />
            <div className="display" style={{ fontSize: 36, marginTop: 16 }}>
              {t("cart.empty", "Your bag is empty.")}
            </div>
            <div style={{ opacity: 0.6, marginTop: 8 }}>
              {t("cart.emptyHint", "Let's fix that.")}
            </div>
            <Btn
              variant="primary"
              size="lg"
              iconRight={<ArrowRight className="h-5 w-5" />}
              style={{ marginTop: 24 }}
              onClick={() => router.push("/products")}
            >
              {t("cart.startShopping", "Start shopping")}
            </Btn>
          </div>
        ) : (
          <div
            data-resp="split"
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr",
              gap: 32,
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "grid", gap: 12 }}>
              {items.map((it) => {
                const name = localized(it.product_name);
                // Comma-separated workaround for the legacy admin upload
                // format. Use the first valid http(s) URL.
                const imgSrc = (it.product_image || "")
                  .split(",")
                  .map((s) => s.trim())
                  .find((s) => s.startsWith("http://") || s.startsWith("https://")) || null;
                return (
                  <div
                    key={it.id}
                    className="cart-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "140px 1fr auto",
                      gap: 20,
                      padding: 16,
                      background: "var(--card)",
                      border: "1.5px solid var(--line)",
                      borderRadius: "var(--radius)",
                    }}
                  >
                    <div
                      className="stripes"
                      style={{
                        position: "relative",
                        width: 140,
                        height: 140,
                        background: "var(--tile-1)",
                        borderRadius: "var(--radius-sm)",
                        overflow: "hidden",
                      }}
                    >
                      {imgSrc && (
                        <Image
                          src={imgSrc}
                          alt={name}
                          fill
                          unoptimized
                          style={{ objectFit: "cover" }}
                        />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>
                        {name}
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            border: "1.5px solid var(--ink)",
                            borderRadius: 999,
                            height: 36,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => updateQty(it.id, it.product_id, it.quantity - 1)}
                            style={{ width: 36, background: "transparent", border: 0, cursor: "pointer" }}
                            aria-label="Decrease"
                          >
                            <Minus className="h-3.5 w-3.5 inline-block" />
                          </button>
                          <div
                            style={{
                              minWidth: 28,
                              textAlign: "center",
                              fontWeight: 700,
                              fontSize: 14,
                            }}
                          >
                            {it.quantity}
                          </div>
                          <button
                            type="button"
                            onClick={() => updateQty(it.id, it.product_id, it.quantity + 1)}
                            style={{ width: 36, background: "transparent", border: 0, cursor: "pointer" }}
                            aria-label="Increase"
                          >
                            <Plus className="h-3.5 w-3.5 inline-block" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRow(it.id, it.product_id)}
                          style={{
                            background: "transparent",
                            border: 0,
                            fontSize: 13,
                            fontWeight: 500,
                            opacity: 0.6,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> {t("cart.remove", "Remove")}
                        </button>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="display" style={{ fontSize: 28 }}>
                        {it.subtotal.toFixed(0)}₾
                      </div>
                      {it.quantity > 1 && (
                        <div style={{ fontSize: 11, opacity: 0.5 }}>
                          {it.price.toFixed(0)}₾ {t("cart.each", "each")}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky summary */}
            <aside
              className="cart-summary"
              style={{
                position: "sticky",
                top: 90,
                padding: 24,
                background: "var(--card)",
                border: "1.5px solid var(--ink)",
                borderRadius: "var(--radius)",
              }}
            >
              <div className="display" style={{ fontSize: 32, marginBottom: 24 }}>
                {t("cart.summary", "Summary")}
              </div>
              <div style={{ display: "grid", gap: 12, fontSize: 14 }}>
                <SummaryRow label={t("cart.subtotal", "Subtotal")} value={`${subtotal.toFixed(0)}₾`} />
                <SummaryRow
                  label={t("cart.shipping", "Shipping")}
                  value={t("cart.shippingPending", "Calculated at checkout")}
                />
                <div
                  style={{
                    height: 1.5,
                    background: "var(--ink)",
                    margin: "8px 0",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>
                    {t("cart.total", "Total")}
                  </span>
                  <span className="display" style={{ fontSize: 28 }}>
                    {total.toFixed(0)}₾
                  </span>
                </div>
                <div style={{ fontSize: 11, opacity: 0.55, textAlign: "right" }}>
                  {t("cart.totalHint", "+ shipping (added at checkout)")}
                </div>
              </div>
              <Btn
                variant="ink"
                size="lg"
                iconRight={<ArrowRight className="h-5 w-5" />}
                style={{ marginTop: 24, width: "100%" }}
                onClick={() => router.push("/checkout")}
              >
                {t("cart.checkout", "Checkout")}
              </Btn>
              <div
                style={{
                  marginTop: 16,
                  fontSize: 11,
                  opacity: 0.6,
                  textAlign: "center",
                }}
              >
                {t("cart.fineprint", "30-day returns · 1-month warranty · Same-day Tbilisi delivery")}
              </div>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
