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
import { useLanguage } from "@/contexts/language-context";
import { Btn } from "../components";

export function VoltageCartPage() {
  const router = useRouter();
  const { t, getLocalizedValue } = useLanguage();
  const { data: cartData, isLoading } = useCartItems();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();

  const items = cartData?.results ?? [];
  const subtotal = items.reduce(
    (s, it) => s + Number(it.price_at_add || 0) * (it.quantity || 0),
    0,
  );
  const ship = subtotal > 99 ? 0 : 9;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + ship + tax;

  const localized = (val: unknown): string => {
    if (typeof val === "string") return val;
    if (val && typeof val === "object") return getLocalizedValue(val as Record<string, string>);
    return "";
  };

  const updateQty = (id: number, qty: number) => {
    if (qty < 1) return;
    updateItem.mutate({ id: String(id), data: { quantity: qty } });
  };

  return (
    <div className="page-enter">
      <section style={{ maxWidth: 1440, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.6, marginBottom: 8 }}>
          <Link href="/" style={{ color: "inherit" }}>
            {t("nav.home") || "Home"}
          </Link>{" "}
          / <strong>{t("cart.title") || "Cart"}</strong>
        </div>
        <h1 className="display" style={{ fontSize: "clamp(48px, 7vw, 96px)", margin: "8px 0 32px" }}>
          {t("cart.heading") || "Your bag."}
        </h1>

        {isLoading ? (
          <div style={{ padding: 80, textAlign: "center", opacity: 0.6 }}>
            {t("cart.loading") || "Loading…"}
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
              {t("cart.empty") || "Your bag is empty."}
            </div>
            <div style={{ opacity: 0.6, marginTop: 8 }}>
              {t("cart.emptyHint") || "Let's fix that."}
            </div>
            <Btn
              variant="primary"
              size="lg"
              iconRight={<ArrowRight className="h-5 w-5" />}
              style={{ marginTop: 24 }}
              onClick={() => router.push("/products")}
            >
              {t("cart.startShopping") || "Start shopping"}
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
                const product = it.product;
                const name = localized(product.name);
                const subtotalRow = Number(it.price_at_add) * (it.quantity || 0);
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
                      {product.image && (
                        <Image
                          src={product.image}
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
                            onClick={() => updateQty(it.id, (it.quantity || 1) - 1)}
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
                            onClick={() => updateQty(it.id, (it.quantity || 0) + 1)}
                            style={{ width: 36, background: "transparent", border: 0, cursor: "pointer" }}
                            aria-label="Increase"
                          >
                            <Plus className="h-3.5 w-3.5 inline-block" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem.mutate(String(it.id))}
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
                          <Trash2 className="h-3.5 w-3.5" /> {t("cart.remove") || "Remove"}
                        </button>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="display" style={{ fontSize: 28 }}>
                        {subtotalRow.toFixed(0)}₾
                      </div>
                      {(it.quantity || 0) > 1 && (
                        <div style={{ fontSize: 11, opacity: 0.5 }}>
                          {Number(it.price_at_add).toFixed(0)}₾ {t("cart.each") || "each"}
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
                {t("cart.summary") || "Summary"}
              </div>
              <div style={{ display: "grid", gap: 12, fontSize: 14 }}>
                <SummaryRow label={t("cart.subtotal") || "Subtotal"} value={`${subtotal.toFixed(0)}₾`} />
                <SummaryRow
                  label={t("cart.shipping") || "Shipping"}
                  value={ship === 0 ? (t("cart.free") || "FREE") : `${ship}₾`}
                />
                <SummaryRow label={t("cart.tax") || "Tax"} value={`${tax}₾`} />
                <div
                  style={{
                    height: 1.5,
                    background: "var(--ink)",
                    margin: "8px 0",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>
                    {t("cart.total") || "Total"}
                  </span>
                  <span className="display" style={{ fontSize: 28 }}>
                    {total.toFixed(0)}₾
                  </span>
                </div>
              </div>
              <Btn
                variant="ink"
                size="lg"
                iconRight={<ArrowRight className="h-5 w-5" />}
                style={{ marginTop: 24, width: "100%" }}
                onClick={() => router.push("/checkout")}
              >
                {t("cart.checkout") || "Checkout"}
              </Btn>
              <div
                style={{
                  marginTop: 16,
                  fontSize: 11,
                  opacity: 0.6,
                  textAlign: "center",
                }}
              >
                {t("cart.fineprint") ||
                  "Free shipping on orders over 100₾ · 30-day returns · 1-month warranty"}
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
