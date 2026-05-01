"use client";

/*
 * Voltage primitives — buttons, pills, stars, product tiles/cards,
 * section headers, marquee. Ported from the prototype's
 * `templates/echodesk/primitives.jsx` but inline-styled instead of
 * Tailwind so the prototype's exact look transfers verbatim.
 *
 * Real data flows through these components — `ProductCard` takes
 * the storefront's `Product` interface from `src/api/generated/...`,
 * not the prototype's hard-coded `PRODUCTS` constant.
 */

import { useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Heart, Plus, Zap } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { ProductList } from "@/api/generated/interfaces";
import { useBackendWishlist } from "@/hooks/use-favorites";
import { useAddToCart, useCart } from "@/hooks/use-cart";
import { useGuestCartMutations } from "@/hooks/use-guest-cart";
import { useAuth } from "@/contexts/auth-context";

// Tile colour palette — six accent-mixed pastel backgrounds the
// prototype used per category card. Resolved against the active
// Voltage tokens at runtime.
export const VOLTAGE_TILES = [
  "var(--tile-1)",
  "var(--tile-2)",
  "var(--tile-3)",
  "var(--tile-4)",
  "var(--tile-5)",
  "var(--tile-6)",
];

/* ================================================================ */
/*  Btn — accent / ink / outline / ghost / soft / danger             */
/* ================================================================ */

type BtnVariant = "primary" | "ink" | "outline" | "ghost" | "soft" | "danger";
type BtnSize = "sm" | "md" | "lg";

interface BtnProps {
  variant?: BtnVariant;
  size?: BtnSize;
  iconRight?: ReactNode;
  icon?: ReactNode;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}

const BTN_SIZES: Record<BtnSize, { h: number; px: number; fz: number }> = {
  sm: { h: 36, px: 14, fz: 13 },
  md: { h: 46, px: 20, fz: 14 },
  lg: { h: 56, px: 28, fz: 16 },
};

export function Btn({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  className = "",
  style = {},
  children,
  onClick,
  disabled,
  type = "button",
}: BtnProps) {
  const s = BTN_SIZES[size];
  const variantStyle: CSSProperties = (
    {
      primary: {
        background: "var(--accent)",
        color: "var(--accent-ink)",
        border: "1.5px solid color-mix(in oklch, var(--accent) 70%, var(--ink))",
      },
      ink: {
        background: "var(--ink)",
        color: "var(--bg)",
        border: "1.5px solid var(--ink)",
      },
      outline: {
        background: "transparent",
        color: "var(--ink)",
        border: "1.5px solid var(--ink)",
      },
      ghost: {
        background: "transparent",
        color: "var(--ink)",
        border: "1.5px solid transparent",
      },
      soft: {
        background: "var(--muted)",
        color: "var(--ink)",
        border: "1.5px solid var(--line)",
      },
      danger: {
        background: "var(--danger)",
        color: "white",
        border: "1.5px solid var(--danger)",
      },
    } as Record<BtnVariant, CSSProperties>
  )[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-${variant} ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: s.h,
        padding: `0 ${s.px}px`,
        fontSize: s.fz,
        fontWeight: 600,
        borderRadius: "var(--radius-pill)",
        whiteSpace: "nowrap",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        ...variantStyle,
        ...style,
      }}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}

/* ================================================================ */
/*  Pill — sticker-style label, sometimes rotated                    */
/* ================================================================ */

interface PillProps {
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
  className?: string;
}

export function Pill({ children, color, style = {}, className = "" }: PillProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        borderRadius: "var(--radius-pill)",
        border: "1.5px solid var(--ink)",
        background: color || "var(--bg)",
        color: "var(--ink)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ================================================================ */
/*  Stars — 5-up filled/empty rating row                             */
/* ================================================================ */

export function Stars({ value = 5, size = 14 }: { value?: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1, color: "var(--ink)" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ opacity: i <= Math.round(value) ? 1 : 0.18 }}
        >
          <path d="m12 2 3.1 6.5 7 .9-5 4.9 1.3 7-6.4-3.5-6.4 3.5 1.3-7-5-4.9 7-.9z" />
        </svg>
      ))}
    </span>
  );
}

/* ================================================================ */
/*  ProductTile — coloured background + simple icon for a category   */
/* ================================================================ */

const ICON_BY_CATEGORY: Record<string, ReactNode> = {
  audio: (
    <g stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round">
      <path d="M30 80V60a35 35 0 0 1 70 0v20" />
      <rect x="22" y="78" width="22" height="34" rx="4" fill="currentColor" />
      <rect x="86" y="78" width="22" height="34" rx="4" fill="currentColor" />
    </g>
  ),
  laptops: (
    <g stroke="currentColor" strokeWidth="3" fill="none" strokeLinejoin="round">
      <rect x="22" y="34" width="86" height="56" rx="4" fill="currentColor" fillOpacity=".18" />
      <path d="M14 96h102l-6 8H20z" fill="currentColor" />
    </g>
  ),
  phones: (
    <g stroke="currentColor" strokeWidth="3" fill="none" strokeLinejoin="round">
      <rect x="42" y="22" width="46" height="86" rx="8" fill="currentColor" fillOpacity=".18" />
      <path d="M58 30h14" />
    </g>
  ),
  default: <circle cx="64" cy="64" r="34" fill="currentColor" fillOpacity=".2" />,
};

interface ProductTileProps {
  /** Index into VOLTAGE_TILES to pick the background colour. */
  idx?: number;
  /** Size in CSS px or a CSS length string. */
  size?: number | string;
  /** Optional product image URL. If missing we render the generic icon. */
  imageUrl?: string | null;
  /** Optional sticker label rendered top-left. */
  tag?: string | null;
  /** Optional category key for picking the placeholder icon. */
  category?: string;
  /** Wrapper rotation in degrees. */
  rotate?: number;
  /** Accessible alt text for the product image. Pass the localised
   * product name for SEO + screen-reader compliance. */
  alt?: string;
}

export function ProductTile({
  idx = 0,
  size = 220,
  imageUrl,
  tag,
  category,
  rotate = 0,
  alt = "",
}: ProductTileProps) {
  const tile = VOLTAGE_TILES[idx % VOLTAGE_TILES.length];
  const sizeCSS = typeof size === "number" ? `${size}px` : size;
  return (
    <div
      className="stripes"
      style={{
        width: sizeCSS,
        height: sizeCSS,
        background: tile,
        borderRadius: "var(--radius)",
        position: "relative",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        transform: rotate ? `rotate(${rotate}deg)` : "none",
        transition: "transform .3s ease",
      }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          unoptimized
          style={{ objectFit: "cover" }}
        />
      ) : (
        <svg
          viewBox="0 0 128 128"
          style={{ width: "64%", height: "64%", color: "var(--ink)" }}
          role="img"
          aria-label={alt || "Product placeholder"}
        >
          {ICON_BY_CATEGORY[category || "default"] || ICON_BY_CATEGORY.default}
        </svg>
      )}
      {tag && (
        <div style={{ position: "absolute", top: 10, left: 10, transform: "rotate(-4deg)" }}>
          <Pill color="var(--accent)" style={{ borderColor: "var(--ink)" }}>
            {tag}
          </Pill>
        </div>
      )}
    </div>
  );
}

/* ================================================================ */
/*  ProductCard — image + brand + name + rating + price              */
/* ================================================================ */

interface ProductCardProps {
  product: ProductList;
  idx?: number;
  // formatted localized name; prefer this over product.name (multilang JSON)
  displayName?: string;
  // optional category key for the placeholder icon when no image
  category?: string;
}

export function ProductCard({ product, idx = 0, displayName, category }: ProductCardProps) {
  const router = useRouter();
  const price = product.price ? Number(product.price) : 0;
  const wasRaw = product.compare_at_price;
  const was = wasRaw ? Number(wasRaw) : null;
  const rating = product.average_rating != null ? Number(product.average_rating) : 0;
  const reviewCount = product.review_count != null ? Number(product.review_count) : 0;
  // Prefer the merged `images[]` from the list serializer (each entry
  // is a {id, image, sort_order, ...}). Fall back to splitting the
  // legacy comma-separated `image` URLField for older API responses.
  // Either way we end up with an ordered URL list and use entry [0]
  // for the still and [1] for the hover-swap.
  const splitLegacy = (raw: string | null | undefined): string[] =>
    (raw || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.startsWith("http://") || s.startsWith("https://"));
  const productImages = (
    product as ProductList & { images?: Array<{ image?: string | null; sort_order?: number | null; id?: number }> }
  ).images;
  const sortedRows = Array.isArray(productImages)
    ? [...productImages].sort((a, b) => {
        const ao = a.sort_order ?? 0;
        const bo = b.sort_order ?? 0;
        if (ao !== bo) return ao - bo;
        return (a.id ?? 0) - (b.id ?? 0);
      })
    : [];
  const imgUrls: string[] = [];
  for (const url of splitLegacy(product.image)) {
    if (!imgUrls.includes(url)) imgUrls.push(url);
  }
  for (const row of sortedRows) {
    for (const url of splitLegacy(row.image)) {
      if (!imgUrls.includes(url)) imgUrls.push(url);
    }
  }
  const imgSrc = imgUrls[0] || null;
  const altImgSrc = imgUrls[1] || imgUrls[0] || null;
  const slug = product.slug;
  const altIdx = idx + 1;

  const { isInWishlist, toggleWishlist } = useBackendWishlist();
  const fav = isInWishlist(product.id);
  const addToCart = useAddToCart();
  const guestCart = useGuestCartMutations();
  const { data: cart } = useCart();
  const { isAuthenticated } = useAuth();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const favRef = useRef<HTMLButtonElement | null>(null);

  const tag =
    was && price && was > price
      ? `–${Math.round(((was - price) / was) * 100)}%`
      : null;

  const goToProduct = () => {
    if (slug) router.push(`/products/${slug}`);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      // Guest cart in localStorage — visitor can keep shopping and
      // either complete a guest checkout or sign in later.
      guestCart.addItem(product.id, 1);
      return;
    }
    if (!cart) return;
    addToCart.mutate({
      cart: cart.id,
      product: product.id,
      quantity: 1,
    });
  };

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
    const el = favRef.current;
    if (el) {
      el.classList.remove("pulse");
      void el.offsetWidth;
      el.classList.add("pulse");
    }
  };

  return (
    <div
      ref={cardRef}
      className="product-card"
      onClick={goToProduct}
      style={{
        cursor: "pointer",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div className="pc-image" style={{ position: "relative", aspectRatio: "1 / 1" }}>
        <div className="pc-tile" style={{ position: "absolute", inset: 0 }}>
          <ProductTile
            idx={idx}
            size="100%"
            imageUrl={imgSrc}
            tag={tag}
            category={category}
            alt={displayName || ""}
          />
        </div>
        <div className="pc-tile alt" aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
          <ProductTile
            idx={altIdx}
            size="100%"
            imageUrl={altImgSrc}
            category={category}
            rotate={-3}
            // Hover-swap tile is decorative — primary already has alt.
            alt=""
          />
        </div>
        <button
          ref={favRef}
          type="button"
          className={`pc-fav${fav ? " is-fav" : ""}`}
          onClick={handleFav}
          aria-label="Favorite"
          style={{
            width: 38,
            height: 38,
            borderRadius: 999,
            background: fav ? "var(--accent)" : "var(--card)",
            border: "1.5px solid var(--ink)",
            display: "grid",
            placeItems: "center",
            color: "var(--ink)",
            cursor: "pointer",
          }}
        >
          <Heart
            className="h-[18px] w-[18px]"
            strokeWidth={fav ? 0 : 1.8}
            fill={fav ? "currentColor" : "none"}
          />
        </button>
        <div className="pc-cta">
          <button
            type="button"
            onClick={handleAdd}
            disabled={addToCart.isPending}
            aria-label="Add to cart"
            style={{
              flex: 1,
              height: 40,
              borderRadius: 999,
              padding: "0 16px",
              background: "var(--ink)",
              color: "var(--bg)",
              border: "1.5px solid var(--ink)",
              fontWeight: 600,
              fontSize: 13,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              cursor: addToCart.isPending ? "wait" : "pointer",
              opacity: addToCart.isPending ? 0.7 : 1,
            }}
          >
            <Plus className="h-4 w-4" /> Add to cart
          </button>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 15,
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayName || ""}
          </div>
          {reviewCount > 0 && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
              <Stars value={rating} size={12} />
              <span style={{ fontSize: 11, opacity: 0.6 }}>({reviewCount})</span>
            </div>
          )}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div className="display" style={{ fontSize: 20 }}>
            {price.toFixed(0)}₾
          </div>
          {was && was > price && (
            <div style={{ fontSize: 11, textDecoration: "line-through", opacity: 0.5 }}>
              {was.toFixed(0)}₾
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================ */
/*  SectionHeader — kicker + title + action link                     */
/* ================================================================ */

interface SectionHeaderProps {
  kicker?: string;
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ kicker, title, action, onAction }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        marginBottom: 32,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          {kicker && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                opacity: 0.6,
                marginBottom: 8,
              }}
            >
              {kicker}
            </div>
          )}
          <h2 className="display" style={{ fontSize: "clamp(36px, 4vw, 56px)", margin: 0 }}>
            {title}
          </h2>
        </div>
        {action && onAction && (
          <button
            type="button"
            onClick={onAction}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 14,
              fontWeight: 600,
              background: "transparent",
              border: 0,
              color: "var(--ink)",
              cursor: "pointer",
            }}
          >
            {action}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ================================================================ */
/*  Marquee — looping band of pills across full bleed                */
/* ================================================================ */

export function Marquee({ items, accent = false }: { items: string[]; accent?: boolean }) {
  const tripled = [...items, ...items, ...items];
  return (
    <div
      style={{
        background: accent ? "var(--accent)" : "var(--ink)",
        color: accent ? "var(--accent-ink)" : "var(--bg)",
        borderTop: "1.5px solid var(--ink)",
        borderBottom: "1.5px solid var(--ink)",
        overflow: "hidden",
        padding: "16px 0",
      }}
    >
      <div
        className="marquee-track"
        style={{
          display: "flex",
          gap: 48,
          whiteSpace: "nowrap",
          width: "max-content",
        }}
      >
        {tripled.map((it, i) => (
          <span
            key={i}
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span>{it}</span>
            <Zap
              className="h-4 w-4"
              fill="currentColor"
              strokeWidth={0}
              aria-hidden="true"
            />
          </span>
        ))}
      </div>
    </div>
  );
}
