"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, Heart, User, Search, Menu, Truck, ShieldCheck, Sun, Moon } from "lucide-react";
import { useStorefrontTemplate } from "@/hooks/use-storefront-template";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { useAuth } from "@/contexts/auth-context";
import { useCartItems } from "@/hooks/use-cart";
import { useGuestCartCount } from "@/hooks/use-guest-cart";
import { useFavorites } from "@/hooks/use-favorites";
import { useLanguage } from "@/contexts/language-context";
import { useTranslate } from "./use-translate";
import { MegaMenu } from "./mega-menu";
import { SearchModal } from "./search-modal";
import { VoltageCookieConsent } from "./cookie-consent";

import "./voltage.css";

interface VoltageLayoutProps {
  children: React.ReactNode;
}

/**
 * Voltage shell — bold electronics-storefront design ported from the
 * prototype at /tmp/ecom-design/.../templates/echodesk/. Wraps every
 * page body when the tenant has `storefront_template = 'voltage'`
 * configured in /settings/ecommerce.
 *
 * In this PR (PR2 of 4) the shell is bare-bones: top utility bar,
 * main header with nav + search + cart + account + wishlist, and a
 * 4-column footer. The page bodies are still rendered by the classic
 * components — they'll be ported page-by-page in PR3 and PR4.
 *
 * The `data-*` attributes on `<html>` drive every Voltage CSS rule:
 * `data-template="voltage"` toggles the entire token system on, and
 * the four sibling attributes pick which preset variant applies.
 */
export function VoltageLayout({ children }: VoltageLayoutProps) {
  const config = useStoreConfig();

  // The `data-template`, `data-theme`, `data-mode`, `data-density`,
  // `data-radius`, and `data-fontpair` attributes are now set
  // server-side on `<html>` by `app/layout.tsx`, so the Voltage CSS
  // resolves on the first paint and there's no flash of the classic
  // shell on refresh. Voltage's Google Fonts `<link>` is also injected
  // server-side in the root layout `<head>`.
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--ink)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-[var(--bg)] focus:text-[var(--ink)]"
      >
        Skip to main content
      </a>
      <VoltageHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <VoltageFooter storeName={config.store?.name || "Storefront"} />
      <VoltageCookieConsent />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HEADER                                                            */
/* ------------------------------------------------------------------ */

function VoltageHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { data: cartData } = useCartItems();
  const { data: favoritesData } = useFavorites();
  const t = useTranslate();
  const { currentLanguage: lang, setLanguage: setLang } = useLanguage();
  const { voltage } = useStorefrontTemplate();
  const config = useStoreConfig();
  const cartItems = cartData?.results ?? [];
  const authedCartCount = cartItems.reduce((a: number, c: { quantity?: number }) => a + (c.quantity || 0), 0);
  const guestCartCount = useGuestCartCount();
  const cartCount = isAuthenticated ? authedCartCount : guestCartCount;
  const favCount = favoritesData?.results?.length ?? 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        data-navlink
        data-active={active}
        className="px-3 py-2 text-sm font-semibold whitespace-nowrap rounded-full"
        style={
          active
            ? { background: "var(--ink)", color: "var(--bg)" }
            : { background: "transparent", color: "var(--ink)" }
        }
      >
        {children}
      </Link>
    );
  };

  const toggleMode = () => {
    // Mode flip is per-tenant only (admin) — the visitor-facing toggle
    // here just shows the current state. Until v1 of the visitor-side
    // theme studio ships (out-of-scope for this PR), this button is a
    // no-op stub.
  };

  return (
    <>
      {/* Top utility bar */}
      <div
        data-utility-bar
        className="border-b"
        style={{
          background: "var(--ink)",
          color: "var(--bg)",
          borderColor: "var(--ink)",
        }}
      >
        <div
          className="mx-auto px-4 py-2 flex justify-between items-center text-xs font-medium"
          style={{ maxWidth: 1440 }}
        >
          <div className="flex gap-3 items-center min-w-0">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <Truck className="h-3.5 w-3.5" /> Tbilisi same-day
            </span>
            <span className="opacity-40 hidden md:inline">·</span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap hidden md:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5" /> 1-month warranty
            </span>
          </div>
          <div className="flex gap-1 items-center whitespace-nowrap">
            <button
              type="button"
              onClick={toggleMode}
              title="Tenant-controlled in admin"
              className="p-1.5 inline-flex items-center"
              style={{ background: "transparent", color: "inherit", border: 0 }}
            >
              {voltage.mode === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            <span className="opacity-30 px-1 hidden md:inline">·</span>
            <div
              className="hidden md:inline-flex gap-0 overflow-hidden"
              style={{
                border: "1px solid color-mix(in oklch, var(--bg) 30%, transparent)",
                borderRadius: 999,
              }}
            >
              {(["en", "ka", "ru"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className="px-2.5 py-1 text-[11px] font-bold uppercase"
                  style={{
                    background: lang === l ? "var(--bg)" : "transparent",
                    color: lang === l ? "var(--ink)" : "var(--bg)",
                    border: 0,
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "var(--bg)",
          borderBottom: "1.5px solid var(--ink)",
        }}
      >
        <div
          className="header-bar mx-auto px-3 sm:px-4 py-3 flex gap-1.5 sm:gap-3 items-center justify-between"
          style={{ maxWidth: 1440 }}
        >
          <button
            type="button"
            aria-label="All categories"
            onClick={() => setMenuOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4 font-bold text-sm flex-shrink-0 cursor-pointer"
            style={{
              background: "var(--ink)",
              color: "var(--bg)",
              border: "1.5px solid var(--ink)",
              borderRadius: 999,
            }}
          >
            <Menu className="h-4 w-4" />
            <span className="hidden sm:inline">All</span>
          </button>
          <Link
            href="/"
            data-logo
            className="inline-flex items-baseline gap-1 flex-shrink-0 min-w-0"
          >
            <span
              className="display tracking-tight font-bold truncate"
              style={{ fontSize: "clamp(18px, 4.5vw, 28px)", lineHeight: 1 }}
            >
              {config.store?.name || "Refurb"}
            </span>
            <span
              className="display tracking-tight font-bold"
              style={{
                color: "var(--accent)",
                fontSize: "clamp(18px, 4.5vw, 28px)",
                lineHeight: 1,
              }}
            >
              .
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-1 justify-center flex-1">
            <NavLink href="/products">{t("nav.shop", "Shop")}</NavLink>
            <NavLink href="/products?tag=sale">{t("nav.sale", "Sale")}</NavLink>
            <NavLink href="/products?tag=new">{t("nav.newArrivals", "New")}</NavLink>
          </nav>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 text-[13px] whitespace-nowrap cursor-pointer"
              style={{
                background: "var(--muted)",
                border: "1.5px solid var(--line)",
                borderRadius: 999,
                color: "var(--ink-soft)",
              }}
            >
              <Search className="h-4 w-4" /> {t("Search", "Search")}
            </button>
            <IconButton
              aria-label="Search"
              className="md:hidden"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </IconButton>
            <IconButton
              aria-label="Wishlist"
              className="hidden md:inline-flex"
              badge={favCount || null}
              onClick={() => router.push("/wishlist")}
            >
              <Heart className="h-5 w-5" />
            </IconButton>
            <IconButton
              aria-label="Account"
              className="hidden md:inline-flex"
              onClick={() => router.push(isAuthenticated ? "/account" : "/login")}
            >
              <User className="h-5 w-5" />
            </IconButton>
            <IconButton
              aria-label="Cart"
              accent
              badge={cartCount || null}
              onClick={() => router.push("/cart")}
            >
              <ShoppingCart className="h-5 w-5" />
            </IconButton>
          </div>
        </div>
      </header>
      {menuOpen && <MegaMenu onClose={() => setMenuOpen(false)} />}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}

function IconButton({
  children,
  badge,
  accent,
  className = "",
  onClick,
  ...rest
}: {
  children: React.ReactNode;
  badge?: number | null;
  accent?: boolean;
  className?: string;
  onClick?: () => void;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "className">) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center justify-center h-10 w-10 ${className}`}
      style={{
        background: accent ? "var(--accent)" : "transparent",
        color: accent ? "var(--accent-ink)" : "var(--ink)",
        border: accent ? "1.5px solid var(--ink)" : "1.5px solid transparent",
        borderRadius: 999,
      }}
      {...rest}
    >
      {children}
      {badge != null && badge > 0 && (
        <span
          className="cart-badge absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none"
          style={{
            background: "var(--ink)",
            color: "var(--bg)",
            borderRadius: 999,
            border: "2px solid var(--bg)",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  FOOTER                                                            */
/* ------------------------------------------------------------------ */

function VoltageFooter({ storeName }: { storeName: string }) {
  // Prototype renders the brand as one giant stroked word at the top of
  // the footer: yellow fill (var(--accent)) + 2px outline in the page
  // background colour. Use the configured store name uppercased.
  const giantBrand = `${storeName.toUpperCase()}.`;
  return (
    <footer
      className="mt-auto"
      style={{
        background: "var(--ink)",
        color: "var(--bg)",
      }}
    >
      <div className="mx-auto px-4 py-12" style={{ maxWidth: 1440 }}>
        <div
          className="display display-shrink"
          style={{
            fontSize: "clamp(60px, 12vw, 200px)",
            lineHeight: 0.85,
            color: "var(--accent)",
            WebkitTextStroke: "2px var(--bg)",
            userSelect: "none",
            marginBottom: 32,
            wordBreak: "break-word",
          }}
        >
          {giantBrand}
        </div>
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8"
          style={{ borderTop: "1.5px solid color-mix(in oklch, var(--bg) 20%, transparent)" }}
        >
          <div>
            <div className="display text-2xl font-bold mb-3">{storeName}.</div>
            <p className="text-sm opacity-70">
              Honest electronics. Same-day delivery in Tbilisi, one-month warranty
              on everything, and humans on the other end of every email.
            </p>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3">Shop</div>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products">All Products</Link></li>
              <li><Link href="/products?tag=sale">Sale</Link></li>
              <li><Link href="/categories">Categories</Link></li>
              <li><Link href="/products?tag=new">New Arrivals</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3">Help</div>
            <ul className="space-y-2 text-sm">
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/shipping">Shipping</Link></li>
              <li><Link href="/returns">Returns</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3">Legal</div>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/terms">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 text-xs opacity-50" style={{ borderTop: "1px solid color-mix(in oklch, var(--bg) 20%, transparent)" }}>
          © {new Date().getFullYear()} {storeName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
