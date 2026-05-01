"use client";

/*
 * Voltage listing (products) page — bold catalog layout ported from
 * the prototype's `templates/echodesk/pages/listing.jsx`. Uses real
 * data via `useProducts` + `useItemLists`, not the prototype's
 * hardcoded PRODUCTS / CATEGORIES.
 */

import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useProducts, useItemLists } from "@/hooks/use-products";
import { useLanguage } from "@/contexts/language-context";
import { useTranslate } from "../use-translate";
import { ProductCard } from "../components";

export function VoltageListingPage() {
  const { data: itemListsData } = useItemLists();
  const itemLists = itemListsData?.results || [];
  const params = useSearchParams();
  const router = useRouter();
  const t = useTranslate();
  const { getLocalizedValue } = useLanguage();

  const itemListId = params.get("item_list");
  const tag = params.get("tag");
  const search = params.get("search") || "";

  const [sort, setSort] = useState<string>("featured");
  const [maxPrice, setMaxPrice] = useState<number>(2000);

  // Real products query. The classic page applies extensive filters
  // through `useProducts`; we keep the same hook so server-side
  // pagination + caching still work, then sort client-side for the
  // Voltage UI.
  const { data: productsResponse, isLoading } = useProducts();
  const products = useMemo(() => {
    let list = (productsResponse?.results || []).slice();
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => {
        const name = typeof p.name === "string" ? p.name : getLocalizedValue(p.name as Record<string, string>);
        return name.toLowerCase().includes(q);
      });
    }
    if (tag === "sale") list = list.filter((p) => p.compare_at_price);
    if (tag === "new") list = list.filter((p) => p.is_featured);
    list = list.filter((p) => Number(p.price) <= maxPrice);
    if (sort === "low") list.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "high") list.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "rating") list.sort((a, b) => Number(b.average_rating || 0) - Number(a.average_rating || 0));
    return list;
  }, [productsResponse, search, tag, maxPrice, sort, getLocalizedValue]);

  const localized = (val: unknown): string => {
    if (typeof val === "string") return val;
    if (val && typeof val === "object") return getLocalizedValue(val as Record<string, string>);
    return "";
  };

  const activeCategory = itemListId ? itemLists.find((c) => String(c.id) === itemListId) : null;
  const title = activeCategory
    ? activeCategory.title
    : tag === "sale"
    ? t("products.onSale", "On sale")
    : tag === "new"
    ? t("products.newArrivals", "New arrivals")
    : t("products.all", "All products");

  return (
    <div className="page-enter">
      {/* Hero strip */}
      <section
        className="pad-mobile-sm"
        style={{
          background: "var(--accent)",
          color: "var(--accent-ink)",
          borderBottom: "1.5px solid var(--ink)",
        }}
      >
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, marginBottom: 8 }}>
            <Link href="/" style={{ color: "inherit" }}>
              {t("nav.home", "Home")}
            </Link>{" "}
            / <strong>{title}</strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <h1 className="display" style={{ fontSize: "clamp(48px, 7vw, 96px)", margin: 0 }}>
              {title}.
            </h1>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {products.length} {t("products.count", "products")}
            </div>
          </div>
        </div>
      </section>

      <section
        className="pad-mobile-sm"
        data-resp="sidebar"
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "32px 24px",
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: 32,
          alignItems: "flex-start",
        }}
      >
        {/* Sidebar filters */}
        <aside
          style={{
            position: "sticky",
            top: 90,
            background: "var(--card)",
            border: "1.5px solid var(--line)",
            borderRadius: "var(--radius)",
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: 0.6,
              marginBottom: 12,
            }}
          >
            {t("products.category", "Category")}
          </div>
          <div style={{ display: "grid", gap: 4 }}>
            <FilterRow
              active={!itemListId}
              onClick={() => router.push("/products")}
              label={t("products.all", "All")}
            />
            {itemLists.map((c) => (
              <FilterRow
                key={c.id}
                active={String(c.id) === itemListId}
                onClick={() => router.push(`/products?item_list=${c.id}`)}
                label={c.title}
              />
            ))}
          </div>
          <div
            style={{
              borderTop: "1.5px solid var(--line)",
              margin: "20px 0",
              paddingTop: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                opacity: 0.6,
                marginBottom: 12,
              }}
            >
              {t("products.maxPrice", "Max price")}
            </div>
            <input
              type="range"
              min={50}
              max={2000}
              step={50}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div className="mono" style={{ fontSize: 13, marginTop: 6 }}>
              ≤ {maxPrice}₾
            </div>
          </div>
        </aside>

        <div>
          {/* Sort row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 14, opacity: 0.6 }}>
              {t("products.showing", "Showing")} {products.length}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, opacity: 0.6 }}>
                {t("products.sort", "Sort")}:
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="mono"
                style={{
                  padding: "6px 12px",
                  background: "var(--card)",
                  border: "1.5px solid var(--line)",
                  borderRadius: 999,
                  fontSize: 13,
                }}
              >
                <option value="featured">{t("products.sortFeatured", "Featured")}</option>
                <option value="low">{t("products.sortLow", "Price: low → high")}</option>
                <option value="high">{t("products.sortHigh", "Price: high → low")}</option>
                <option value="rating">{t("products.sortRating", "Top rated")}</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div
              data-resp="3-2"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 24,
              }}
            >
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: "0.75",
                    background: "var(--muted)",
                    borderRadius: "var(--radius)",
                    animation: "pulse 1.6s ease-in-out infinite",
                  }}
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div
              style={{
                padding: 80,
                textAlign: "center",
                border: "1.5px dashed var(--line)",
                borderRadius: "var(--radius)",
              }}
            >
              <div className="display" style={{ fontSize: 32 }}>
                {t("products.noResults", "No products match your filters.")}
              </div>
            </div>
          ) : (
            <div
              data-resp="3-2"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 24,
              }}
            >
              {products.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  idx={i}
                  displayName={localized(p.name)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function FilterRow({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 12px",
        background: active ? "var(--ink)" : "transparent",
        color: active ? "var(--bg)" : "var(--ink)",
        border: 0,
        borderRadius: 999,
        fontSize: 14,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
      }}
    >
      {label}
    </button>
  );
}
