"use client";

/*
 * Voltage product detail page — bold split layout: gallery on the
 * left, sticky info column on the right. Ported from the prototype
 * `templates/echodesk/pages/product.jsx`.
 *
 * Wires real backend data via the `ProductDetail` shape returned by
 * `useProductBySlug` — no prototype constants.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Heart, Plus, Minus, ArrowRight, Truck, ShieldCheck, RefreshCw } from "lucide-react";
import type { ProductDetail } from "@/api/generated/interfaces";
import { useLanguage } from "@/contexts/language-context";
import { useTranslate } from "../use-translate";
import { useAddToCart, useCart } from "@/hooks/use-cart";
import { Btn, Pill, Stars } from "../components";

interface VoltageProductPageProps {
  product: ProductDetail;
}

export function VoltageProductPage({ product }: VoltageProductPageProps) {
  const router = useRouter();
  const t = useTranslate();
  const { getLocalizedValue } = useLanguage();
  const addToCart = useAddToCart();
  const { data: cart } = useCart();
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"specs" | "description" | "reviews">("specs");

  const localized = (val: unknown): string => {
    if (typeof val === "string") return val;
    if (val && typeof val === "object") return getLocalizedValue(val as Record<string, string>);
    return "";
  };

  const name = localized(product.name);
  const description = localized(product.description);
  const price = Number(product.price);
  const was = product.compare_at_price ? Number(product.compare_at_price) : null;
  const rating = product.average_rating != null ? Number(product.average_rating) : 0;
  const reviewCount = product.review_count != null ? Number(product.review_count) : 0;
  // Build the gallery from the sorted `product.images` list (sorted by
  // sort_order, then id as tiebreaker — first uploaded becomes the
  // hero). Fall back to the singular `product.image` only when the
  // images array is empty so the order on the admin matches the order
  // visitors see.
  const sortedImages = [...(product.images || [])].sort((a, b) => {
    const ao = a.sort_order ?? 0;
    const bo = b.sort_order ?? 0;
    if (ao !== bo) return ao - bo;
    return a.id - b.id;
  });
  const galleryUrls: string[] = [];
  for (const img of sortedImages) {
    if (img.image && !galleryUrls.includes(img.image)) galleryUrls.push(img.image);
  }
  if (galleryUrls.length === 0 && product.image) galleryUrls.push(product.image);
  const heroImg = galleryUrls[imgIdx] || null;

  const handleAddToCart = () => {
    if (!cart?.id) return;
    addToCart.mutate({ cart: cart.id, product: product.id, quantity: qty });
  };

  return (
    <div className="page-enter">
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "24px 24px 0" }}>
        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.6 }}>
          <Link href="/" style={{ color: "inherit" }}>
            {t("nav.home", "Home")}
          </Link>{" "}
          /{" "}
          <Link href="/products" style={{ color: "inherit" }}>
            {t("nav.shop", "Shop")}
          </Link>{" "}
          / <strong>{name}</strong>
        </div>
      </div>

      <section
        className="pad-mobile-sm"
        data-resp="split"
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "24px 24px",
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 48,
          alignItems: "flex-start",
        }}
      >
        {/* Gallery */}
        <div>
          <div
            className="stripes"
            style={{
              position: "relative",
              aspectRatio: "1 / 1",
              background: "var(--tile-1)",
              borderRadius: "var(--radius)",
              overflow: "hidden",
            }}
          >
            {heroImg ? (
              <Image
                src={heroImg}
                alt={name}
                fill
                unoptimized
                style={{ objectFit: "cover" }}
              />
            ) : null}
            {was && was > price && (
              <div
                style={{
                  position: "absolute",
                  top: 24,
                  left: 24,
                  transform: "rotate(-6deg)",
                }}
              >
                <Pill style={{ background: "var(--accent)", fontSize: 14, padding: "8px 16px" }}>
                  {t("product.save", "SAVE")} {(was - price).toFixed(0)}₾
                </Pill>
              </div>
            )}
          </div>
          {galleryUrls.length > 1 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(galleryUrls.length, 4)}, 1fr)`,
                gap: 12,
                marginTop: 16,
              }}
            >
              {galleryUrls.slice(0, 4).map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setImgIdx(i)}
                  style={{
                    padding: 0,
                    border: imgIdx === i ? "2px solid var(--ink)" : "1.5px solid var(--line)",
                    borderRadius: "var(--radius-sm)",
                    background: "transparent",
                    overflow: "hidden",
                    aspectRatio: "1",
                    position: "relative",
                    cursor: "pointer",
                  }}
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    unoptimized
                    style={{ objectFit: "cover" }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="product-info" style={{ position: "sticky", top: 90 }}>
          <h1
            className="display"
            style={{ fontSize: "clamp(36px, 5vw, 56px)", margin: "8px 0 16px", lineHeight: 1 }}
          >
            {name}
          </h1>
          {reviewCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <Stars value={rating} size={18} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{rating.toFixed(1)}</span>
              <span style={{ fontSize: 14, opacity: 0.6 }}>({reviewCount})</span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              marginBottom: 32,
              flexWrap: "wrap",
            }}
          >
            <span className="display" style={{ fontSize: 48 }}>
              {price.toFixed(0)}₾
            </span>
            {was && was > price && (
              <>
                <span
                  style={{
                    fontSize: 20,
                    textDecoration: "line-through",
                    opacity: 0.5,
                  }}
                >
                  {was.toFixed(0)}₾
                </span>
                <Pill style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>
                  −{Math.round((1 - price / was) * 100)}%
                </Pill>
              </>
            )}
          </div>

          {/* Quantity + Add to cart */}
          <div style={{ display: "flex", gap: 12, alignItems: "stretch", marginBottom: 24 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: "1.5px solid var(--ink)",
                borderRadius: 999,
                height: 56,
              }}
            >
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                style={{
                  width: 48,
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                }}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4 inline-block" />
              </button>
              <div
                style={{
                  minWidth: 36,
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {qty}
              </div>
              <button
                type="button"
                onClick={() => setQty(qty + 1)}
                style={{
                  width: 48,
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                }}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4 inline-block" />
              </button>
            </div>
            <Btn
              variant="ink"
              size="lg"
              iconRight={<ArrowRight className="h-5 w-5" />}
              onClick={handleAddToCart}
              disabled={addToCart.isPending || !product.is_in_stock}
              style={{ flex: 1 }}
            >
              {!product.is_in_stock
                ? t("product.outOfStock", "Out of stock")
                : addToCart.isPending
                ? t("product.adding", "Adding…")
                : t("product.addToCart", "Add to cart")}
            </Btn>
            <button
              type="button"
              style={{
                width: 56,
                height: 56,
                background: "transparent",
                border: "1.5px solid var(--ink)",
                borderRadius: 999,
                cursor: "pointer",
              }}
              aria-label="Add to wishlist"
            >
              <Heart className="h-5 w-5 inline-block" />
            </button>
          </div>

          {/* Trust strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
              marginBottom: 32,
            }}
          >
            {[
              { icon: <Truck className="h-4 w-4" />, label: t("product.fastDelivery", "Same-day Tbilisi") },
              { icon: <ShieldCheck className="h-4 w-4" />, label: t("product.warranty", "1-month warranty") },
              { icon: <RefreshCw className="h-4 w-4" />, label: t("product.returns", "30-day returns") },
            ].map((row, i) => (
              <div
                key={i}
                style={{
                  padding: 12,
                  background: "var(--muted)",
                  border: "1.5px solid var(--line)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {row.icon}
                <span>{row.label}</span>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div
            style={{
              borderTop: "1.5px solid var(--ink)",
              paddingTop: 24,
            }}
          >
            <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
              {(["specs", "description", "reviews"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  style={{
                    padding: "8px 16px",
                    background: tab === id ? "var(--ink)" : "transparent",
                    color: tab === id ? "var(--bg)" : "var(--ink)",
                    border: 0,
                    borderRadius: 999,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {id === "specs"
                    ? t("product.specs", "Specs")
                    : id === "description"
                    ? t("product.description", "Description")
                    : t("product.reviews", "Reviews")}
                </button>
              ))}
            </div>
            {tab === "specs" && (
              <div style={{ display: "grid", gap: 8 }}>
                {(product.attribute_values || []).map((av, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--line)",
                      fontSize: 14,
                    }}
                  >
                    <span style={{ opacity: 0.6 }}>
                      {localized((av as { attribute_name?: unknown }).attribute_name) ||
                        (av as { attribute_label?: string }).attribute_label}
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      {localized((av as { value?: unknown }).value) ||
                        String((av as { display_value?: string }).display_value || "")}
                    </span>
                  </div>
                ))}
                {(!product.attribute_values || product.attribute_values.length === 0) && (
                  <p style={{ fontSize: 14, opacity: 0.6 }}>
                    {t("product.noSpecs", "No specs available.")}
                  </p>
                )}
              </div>
            )}
            {tab === "description" && (
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  opacity: 0.85,
                  whiteSpace: "pre-wrap",
                }}
              >
                {description || t("product.noDescription", "No description provided.")}
              </div>
            )}
            {tab === "reviews" && (
              <div style={{ fontSize: 14, opacity: 0.85 }}>
                {reviewCount === 0
                  ? t("product.noReviews", "No reviews yet.")
                  : `${reviewCount} ${t("product.reviewsCount", "reviews")} · ${rating.toFixed(1)} ★`}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
