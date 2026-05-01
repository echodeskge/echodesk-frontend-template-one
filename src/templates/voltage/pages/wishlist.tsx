"use client";

/* Voltage wishlist — favorites grid using the real `useFavorites` hook. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ArrowRight } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { useLanguage } from "@/contexts/language-context";
import { Btn, ProductCard } from "../components";
import type { ProductList } from "@/api/generated/interfaces";

export function VoltageWishlistPage() {
  const router = useRouter();
  const { t, getLocalizedValue } = useLanguage();
  const { data, isLoading } = useFavorites();
  // Backend serializer attaches the full product object even though
  // the generated `FavoriteProduct.product` is typed as `string`. The
  // classic wishlist does the same widening at the call site.
  const items = (data?.results || [])
    .map((f) => f.product as unknown as ProductList | undefined)
    .filter((p): p is ProductList => Boolean(p) && typeof p === "object");

  const localized = (val: unknown): string => {
    if (typeof val === "string") return val;
    if (val && typeof val === "object") return getLocalizedValue(val as Record<string, string>);
    return "";
  };

  return (
    <div className="page-enter">
      <section style={{ maxWidth: 1440, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.6, marginBottom: 8 }}>
          <Link href="/" style={{ color: "inherit" }}>
            {t("nav.home") || "Home"}
          </Link>{" "}
          / <strong>{t("wishlist.title") || "Wishlist"}</strong>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <h1 className="display" style={{ fontSize: "clamp(48px, 7vw, 88px)", margin: 0 }}>
            {t("wishlist.heading") || "Wishlist."}
          </h1>
          <div style={{ fontSize: 14, opacity: 0.6 }}>
            {items.length} {t("wishlist.saved") || "saved"}
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: 80, textAlign: "center", opacity: 0.6 }}>
            {t("wishlist.loading") || "Loading…"}
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
            <Heart className="h-12 w-12 mx-auto" />
            <div className="display" style={{ fontSize: 36, marginTop: 16 }}>
              {t("wishlist.empty") || "Nothing saved yet."}
            </div>
            <div style={{ opacity: 0.6, marginTop: 8 }}>
              {t("wishlist.emptyHint") || "Tap the heart on anything you like."}
            </div>
            <Btn
              variant="primary"
              size="lg"
              iconRight={<ArrowRight className="h-5 w-5" />}
              style={{ marginTop: 24 }}
              onClick={() => router.push("/products")}
            >
              {t("wishlist.browse") || "Browse products"}
            </Btn>
          </div>
        ) : (
          <div
            data-resp="4-2"
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}
          >
            {items.map((p, i) => (
              <ProductCard key={p.id} product={p} idx={i} displayName={localized(p.name)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
