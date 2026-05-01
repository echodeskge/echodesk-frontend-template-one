"use client";

/*
 * Voltage home page — bold electronics layout ported from the
 * prototype's `templates/echodesk/pages/home.jsx`.
 *
 * Receives the same props as `HomePageClient` (feature parity) so
 * the parent `<HomePageClient>` can branch on the tenant's template
 * choice without rewiring its server-side data fetch.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Zap, Package } from "lucide-react";
import type { ProductList } from "@/api/generated/interfaces";
import type { ItemList } from "@/lib/fetch-server";
import { useLanguage } from "@/contexts/language-context";
import { useTranslate } from "../use-translate";
import {
  Btn,
  Marquee,
  Pill,
  ProductCard,
  ProductTile,
  SectionHeader,
  Stars,
  VOLTAGE_TILES,
} from "../components";

interface VoltageHomePageProps {
  featuredProducts: ProductList[];
  itemLists: ItemList[];
}

// Static testimonials for the "Real reviews" section. We don't have a
// reviews-by-store API yet — these are placeholders the tenant can
// later swap in via a homepage_section block.
const TESTIMONIALS = [
  { who: "Maya R.", city: "Berlin", text: "Looks brand new and saved me 160₾. Shipped in two days flat.", rating: 5 },
  { who: "Ade O.", city: "Lagos", text: "Customer support actually replied within an hour. Real humans. Wild.", rating: 5 },
  { who: "Jonas L.", city: "Stockholm", text: "Got an A-grade laptop that genuinely felt brand new. The 1-month warranty sealed it.", rating: 4 },
  { who: "Priya S.", city: "Mumbai", text: "Packaging is gorgeous and recyclable. Honestly considered keeping the box.", rating: 5 },
];

export function VoltageHomePage({ featuredProducts, itemLists }: VoltageHomePageProps) {
  const router = useRouter();
  const t = useTranslate();
  const { getLocalizedValue } = useLanguage();
  const featured = featuredProducts.slice(0, 4);
  const popular = featuredProducts.slice(0, 8);

  // Resolve a multilang JSON name to the active locale's string.
  // Backwards-compat: if it's already a plain string, pass through.
  const localized = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (value && typeof value === "object") return getLocalizedValue(value as Record<string, string>);
    return "";
  };

  return (
    <div className="page-enter">
      {/* ============== Hero ============== */}
      <section
        style={{
          borderBottom: "1.5px solid var(--ink)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="pad-mobile min-h-shrink"
          data-resp="split"
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            padding: "24px 24px 0",
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 48,
            alignItems: "center",
            minHeight: 600,
          }}
        >
          <div className="hero-in" style={{ position: "relative", zIndex: 2 }}>
            <Pill style={{ background: "var(--accent)" }}>
              <Zap className="h-3 w-3" /> {t("home.heroKicker", "Spring '26")}
            </Pill>
            <h1
              className="display display-shrink"
              style={{ fontSize: "clamp(64px, 9vw, 144px)", margin: "20px 0" }}
            >
              {t("home.heroLine1", "Gear that")}{" "}
              <span
                className="hero-highlight"
                style={{
                  background: "var(--accent)",
                  padding: "0 12px",
                  borderRadius: 12,
                  display: "inline-block",
                }}
              >
                {t("home.heroAccent", "actually")}
              </span>
              <br />
              {t("home.heroLine2", "feels good.")}
            </h1>
            <p style={{ fontSize: 18, maxWidth: 480, opacity: 0.75, lineHeight: 1.5 }}>
              {t("home.heroSubcopy", "Honest electronics. Same-day delivery in Tbilisi, one-month warranty on everything, and humans on the other end of every email.")}
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
              <Btn
                variant="ink"
                size="lg"
                iconRight={<ArrowRight className="h-5 w-5" />}
                onClick={() => router.push("/products")}
              >
                {t("home.shopAll", "Shop everything")}
              </Btn>
              <Btn variant="outline" size="lg" onClick={() => router.push("/new-arrivals")}>
                {t("home.whatsNew", "What's new")}
              </Btn>
            </div>
            <div
              style={{
                display: "flex",
                gap: 24,
                marginTop: 40,
                alignItems: "center",
                fontSize: 13,
                opacity: 0.7,
                flexWrap: "wrap",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Check className="h-4 w-4" /> {t("home.feature1", "30-day returns")}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Check className="h-4 w-4" /> {t("home.feature2", "Same-day Tbilisi")}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Check className="h-4 w-4" /> {t("home.feature3", "1-month warranty")}
              </span>
            </div>
          </div>
          {/* Hero floating product tiles */}
          <div className="hero-stack" style={{ position: "relative", height: 540 }}>
            {featured[0] && (
              <div
                className="hero-tile-1"
                style={{
                  position: "absolute",
                  top: 20,
                  right: 0,
                  width: 360,
                  height: 360,
                  transform: "rotate(6deg)",
                }}
              >
                <ProductTile
                  idx={0}
                  size={360}
                  imageUrl={featured[0].image || null}
                />
              </div>
            )}
            {featured[1] && (
              <div
                className="hero-tile-2"
                style={{
                  position: "absolute",
                  bottom: 30,
                  left: 20,
                  width: 220,
                  height: 220,
                  transform: "rotate(-8deg)",
                }}
              >
                <ProductTile
                  idx={4}
                  size={220}
                  imageUrl={featured[1].image || null}
                />
              </div>
            )}
            {featured[2] && (
              <div
                className="hero-tile-3"
                style={{
                  position: "absolute",
                  top: 100,
                  left: 220,
                  width: 160,
                  height: 160,
                  transform: "rotate(12deg)",
                }}
              >
                <ProductTile
                  idx={2}
                  size={160}
                  imageUrl={featured[2].image || null}
                />
              </div>
            )}
            <div
              data-hero-badge
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                padding: "8px 14px",
                background: "var(--ink)",
                color: "var(--bg)",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: "nowrap",
                zIndex: 3,
              }}
            >
              {t("home.heroBadge", "NEW · APR 2026")}
            </div>
            {featured[0] && (
              <div
                className="hero-pricetag"
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 40,
                  padding: "12px 16px",
                  background: "var(--card)",
                  border: "1.5px solid var(--ink)",
                  borderRadius: 16,
                  transform: "rotate(4deg)",
                  maxWidth: 200,
                }}
              >
                <div className="mono" style={{ fontSize: 11, opacity: 0.6 }}>
                  {t("home.priceFrom", "FROM")}
                </div>
                <div className="display" style={{ fontSize: 28 }}>
                  {Number(featured[0].price).toFixed(0)}₾
                </div>
                <div style={{ fontSize: 11 }}>
                  {featuredProducts.length}+ {t("home.productsCount", "products")}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============== Marquee ============== */}
      <Marquee
        accent
        items={[
          t("home.marquee1", "SAME-DAY IN TBILISI"),
          t("home.marquee2", "1-MONTH WARRANTY"),
          t("home.marquee3", "30-DAY RETURNS"),
          t("home.marquee4", "CARBON-NEUTRAL DELIVERY"),
          t("home.marquee5", "4.9 STAR RATING"),
        ]}
      />

      {/* ============== Categories ============== */}
      {itemLists.length > 0 && (
        <section
          className="pad-mobile"
          style={{ maxWidth: 1440, margin: "0 auto", padding: "80px 24px" }}
        >
          <SectionHeader
            kicker={t("home.categoriesKicker", "Categories")}
            title={t("home.categoriesTitle", "Find your thing.")}
            action={t("home.viewAll", "View all")}
            onAction={() => router.push("/categories")}
          />
          <div
            data-resp="row-slider"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
            }}
          >
            {itemLists.slice(0, 8).map((cat, i) => (
              <Link
                key={cat.id}
                href={`/products?item_list=${cat.id}`}
                style={{
                  padding: 24,
                  borderRadius: "var(--radius)",
                  border: "1.5px solid var(--ink)",
                  background: VOLTAGE_TILES[i % VOLTAGE_TILES.length],
                  display: "flex",
                  flexDirection: "column",
                  gap: 24,
                  minHeight: 180,
                  transition: "transform .2s ease",
                }}
              >
                <div className="mono" style={{ fontSize: 11, opacity: 0.7 }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ marginTop: "auto" }}>
                  <div className="display" style={{ fontSize: 32 }}>
                    {localized(cat.name)}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ============== Featured big card ============== */}
      {featured[0] && (
        <section style={{ maxWidth: 1440, margin: "0 auto", padding: "40px 24px" }}>
          <div
            className="pad-mobile"
            data-resp="split"
            style={{
              background: "var(--accent-2)",
              color: "var(--accent-2-ink)",
              borderRadius: "var(--radius)",
              border: "1.5px solid var(--ink)",
              padding: 48,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 48,
              alignItems: "center",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div>
              <Pill style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>
                {t("home.featuredKicker", "Featured drop")}
              </Pill>
              <h3
                className="display"
                style={{ fontSize: "clamp(48px, 6vw, 88px)", margin: "20px 0" }}
              >
                {localized(featured[0].name)}
              </h3>
              <Btn
                variant="primary"
                size="lg"
                iconRight={<ArrowRight className="h-5 w-5" />}
                onClick={() => router.push(`/products/${featured[0].slug}`)}
              >
                {t("home.shopFor", "Shop for")}{" "}
                {Number(featured[0].price).toFixed(0)}₾
              </Btn>
            </div>
            <div className="min-h-shrink" style={{ position: "relative", height: 420 }}>
              <div style={{ position: "absolute", inset: 0, transform: "rotate(-4deg)" }}>
                <ProductTile idx={0} size="100%" imageUrl={featured[0].image || null} />
              </div>
              {featured[0].compare_at_price && (
                <div
                  style={{
                    position: "absolute",
                    bottom: -20,
                    right: -20,
                    padding: 16,
                    background: "var(--accent)",
                    color: "var(--accent-ink)",
                    border: "1.5px solid var(--ink)",
                    borderRadius: 999,
                    transform: "rotate(8deg)",
                    width: 120,
                    height: 120,
                    display: "grid",
                    placeItems: "center",
                    textAlign: "center",
                  }}
                >
                  <div>
                    <div className="display" style={{ fontSize: 28 }}>
                      –
                      {Math.round(
                        ((Number(featured[0].compare_at_price) - Number(featured[0].price)) /
                          Number(featured[0].compare_at_price)) *
                          100,
                      )}
                      %
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }}>
                      {t("home.thisWeek", "THIS WEEK")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ============== Bestsellers ============== */}
      {popular.length > 0 && (
        <section
          className="pad-mobile"
          style={{ maxWidth: 1440, margin: "0 auto", padding: "80px 24px" }}
        >
          <SectionHeader
            kicker={t("home.bestsellersKicker", "Hot right now")}
            title={t("home.bestsellersTitle", "Best sellers.")}
            action={t("home.viewAll", "View all")}
            onAction={() => router.push("/products")}
          />
          <div
            data-resp="row-slider"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 24,
            }}
          >
            {popular.slice(0, 4).map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                idx={i}
                displayName={localized(p.name)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ============== Editorial split ============== */}
      <section
        className="pad-mobile"
        style={{ maxWidth: 1440, margin: "0 auto", padding: "40px 24px" }}
      >
        <div
          data-resp="split"
          style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}
        >
          <div
            className="stripes min-h-shrink"
            style={{
              borderRadius: "var(--radius)",
              border: "1.5px solid var(--ink)",
              overflow: "hidden",
              position: "relative",
              minHeight: 480,
              background: "var(--tile-2)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 24,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Pill style={{ background: "var(--bg)" }}>
                {t("home.editorsPick", "Editor's pick")}
              </Pill>
              <div>
                <h3
                  className="display"
                  style={{ fontSize: "clamp(36px, 4vw, 60px)", maxWidth: 520 }}
                >
                  {t("home.editorsPickTitle", "The desk setup that made our designer weep (in a good way).")}
                </h3>
                <Btn
                  variant="ink"
                  size="md"
                  iconRight={<ArrowRight className="h-5 w-5" />}
                  onClick={() => router.push("/products")}
                  style={{ marginTop: 16 }}
                >
                  {t("home.shopTheLook", "Shop the look")}
                </Btn>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gap: 24 }}>
            <div
              style={{
                borderRadius: "var(--radius)",
                border: "1.5px solid var(--ink)",
                overflow: "hidden",
                position: "relative",
                background: "var(--tile-3)",
                padding: 32,
              }}
            >
              <div className="display" style={{ fontSize: 48 }}>
                –30%
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8, marginBottom: 16 }}>
                {t("home.bundleCopy", "Bundle a phone with audio. Save big.")}
              </div>
              <Btn variant="ink" size="sm" onClick={() => router.push("/sale")}>
                {t("home.seeBundles", "See bundles")}
              </Btn>
            </div>
            <div
              style={{
                borderRadius: "var(--radius)",
                border: "1.5px solid var(--ink)",
                background: "var(--ink)",
                color: "var(--bg)",
                padding: 32,
              }}
            >
              <Package className="h-7 w-7" />
              <div className="display" style={{ fontSize: 32, marginTop: 12 }}>
                {t("home.tradeIn", "Trade in.")}
              </div>
              <div style={{ fontSize: 14, opacity: 0.7, marginTop: 8 }}>
                {t("home.tradeInCopy", "Get up to 400₾ credit toward a new device.")}
              </div>
              <Btn variant="primary" size="sm" style={{ marginTop: 16 }}>
                {t("home.getQuote", "Get a quote")}
              </Btn>
            </div>
          </div>
        </div>
      </section>

      {/* ============== Reviews ============== */}
      <section
        className="pad-mobile"
        style={{ maxWidth: 1440, margin: "0 auto", padding: "80px 24px" }}
      >
        <SectionHeader
          kicker={t("home.reviewsKicker", "What people say")}
          title={t("home.reviewsTitle", "Real reviews. Real humans.")}
        />
        <div
          data-resp="row-slider"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          {TESTIMONIALS.map((r, i) => (
            <div
              key={i}
              style={{
                background: VOLTAGE_TILES[i % VOLTAGE_TILES.length],
                borderRadius: "var(--radius)",
                border: "1.5px solid var(--ink)",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                minHeight: 240,
              }}
            >
              <Stars value={r.rating} size={16} />
              <p style={{ fontSize: 16, lineHeight: 1.4, fontWeight: 500 }}>
                &ldquo;{r.text}&rdquo;
              </p>
              <div style={{ marginTop: "auto", fontSize: 13 }}>
                <div style={{ fontWeight: 700 }}>{r.who}</div>
                <div style={{ opacity: 0.6 }}>{r.city}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============== Stats ============== */}
      <section
        className="pad-mobile"
        style={{ maxWidth: 1440, margin: "0 auto", padding: "40px 24px 80px" }}
      >
        <div
          data-resp="4-2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1,
            background: "var(--ink)",
            border: "1.5px solid var(--ink)",
            borderRadius: "var(--radius)",
            overflow: "hidden",
          }}
        >
          {[
            ["41,000+", t("home.statHappy", "happy customers")],
            ["87", t("home.statCountries", "countries shipped")],
            ["4.9 / 5", t("home.statRating", "average rating")],
            ["< 1h", t("home.statSupport", "support response")],
          ].map(([n, l]) => (
            <div key={l} style={{ background: "var(--bg)", padding: 32 }}>
              <div className="display" style={{ fontSize: "clamp(32px, 4vw, 56px)" }}>
                {n}
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
