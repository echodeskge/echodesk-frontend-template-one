"use client";

/*
 * Voltage MegaMenu — slide-in left panel that doubles as the mobile
 * navigation drawer. Triggered by the "All" button in the header.
 * Lists Shop / Sale / New, real categories from `useItemLists`,
 * Account / Wishlist links, and a footer with language switcher +
 * Sign in CTA. Single-column on mobile, two-column on desktop with
 * a "Featured in {category}" right pane.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Zap, ArrowUpRight, X, ChevronRight, User, Heart, ArrowRight } from "lucide-react";
import { useItemLists } from "@/hooks/use-products";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { Btn } from "./components";
import { useTranslate } from "./use-translate";

interface MegaMenuProps {
  onClose: () => void;
}

export function MegaMenu({ onClose }: MegaMenuProps) {
  const t = useTranslate();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { currentLanguage: lang, setLanguage: setLang } = useLanguage();
  const { data: itemListsData } = useItemLists();
  const itemLists = itemListsData?.results || [];

  const [hoverCat, setHoverCat] = useState<number | null>(null);
  const activeCat = hoverCat ?? itemLists[0]?.id ?? null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const navTo = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "color-mix(in oklch, var(--ink) 50%, transparent)",
        zIndex: 100,
        animation: "fadein .2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mega-panel"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: "min(96%, 920px)",
          background: "var(--bg)",
          borderRight: "1.5px solid var(--ink)",
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          animation: "megaSlide .26s cubic-bezier(.2,.8,.3,1) both",
        }}
      >
        {/* Left panel — primary navigation */}
        <div
          className="mega-left"
          style={{
            display: "flex",
            flexDirection: "column",
            borderRight: "1.5px solid var(--line)",
            minHeight: 0,
          }}
        >
          <div
            style={{
              padding: 16,
              borderBottom: "1.5px solid var(--line)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
              <span className="display" style={{ fontSize: 24 }}>
                {t("menu.title", "Menu")}
              </span>
            </div>
            <button
              onClick={onClose}
              type="button"
              aria-label="Close"
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                background: "var(--muted)",
                border: 0,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div style={{ padding: 12, display: "grid", gap: 4, flex: 1, overflowY: "auto" }}>
            {/* Top quick links */}
            <NavRow
              icon={<Package className="h-4 w-4" />}
              label={t("nav.shopAll", "Shop everything")}
              onClick={() => navTo("/products")}
            />
            <NavRow
              icon={<Zap className="h-4 w-4" />}
              label={t("nav.sale", "Sale")}
              onClick={() => navTo("/sale")}
            />
            <NavRow
              icon={<ArrowUpRight className="h-4 w-4" />}
              label={t("nav.newArrivals", "New arrivals")}
              onClick={() => navTo("/new-arrivals")}
            />

            {/* Categories */}
            {itemLists.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    opacity: 0.5,
                    padding: "16px 16px 4px",
                  }}
                >
                  {t("menu.categories", "Categories")}
                </div>
                {itemLists.map((c) => {
                  const isActive = activeCat === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onMouseEnter={() => setHoverCat(c.id)}
                      onFocus={() => setHoverCat(c.id)}
                      onClick={() => navTo(`/products?item_list=${c.id}`)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 16px",
                        borderRadius: "var(--radius-sm)",
                        background: isActive ? "var(--muted)" : "transparent",
                        border: 0,
                        fontSize: 15,
                        fontWeight: isActive ? 700 : 500,
                        textAlign: "left",
                        position: "relative",
                        cursor: "pointer",
                      }}
                    >
                      <span>{c.title}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span className="mono" style={{ fontSize: 11, opacity: 0.5 }}>
                          {c.items_count}
                        </span>
                        {isActive && <ChevronRight className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  );
                })}
              </>
            )}

            {/* Account links */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                opacity: 0.5,
                padding: "16px 16px 4px",
              }}
            >
              {t("menu.account", "Account")}
            </div>
            <NavRow
              icon={<User className="h-4 w-4" />}
              label={t("nav.account", "My account")}
              onClick={() => navTo(isAuthenticated ? "/account" : "/login")}
            />
            <NavRow
              icon={<Heart className="h-4 w-4" />}
              label={t("nav.wishlist", "Wishlist")}
              onClick={() => navTo("/wishlist")}
            />
          </div>

          {/* Footer */}
          <div
            style={{
              padding: 16,
              borderTop: "1.5px solid var(--line)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                gap: 0,
                border: "1.5px solid var(--ink)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              {(["en", "ka", "ru"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  style={{
                    background: lang === l ? "var(--ink)" : "transparent",
                    color: lang === l ? "var(--bg)" : "var(--ink)",
                    border: 0,
                    padding: "6px 12px",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            {!isAuthenticated && (
              <Btn variant="outline" size="sm" onClick={() => navTo("/login")}>
                {t("auth.signIn", "Sign in")}
              </Btn>
            )}
          </div>
        </div>

        {/* Right pane — desktop only */}
        <div
          className="mega-right"
          style={{
            background: "var(--muted)",
            padding: 28,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {(() => {
            const c = itemLists.find((x) => x.id === activeCat);
            if (!c) {
              return (
                <div style={{ opacity: 0.55, fontSize: 14, padding: 24 }}>
                  {t("menu.hoverCategory", "Hover a category to see featured items.")}
                </div>
              );
            }
            return (
              <>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    opacity: 0.55,
                  }}
                >
                  {t("menu.featuredIn", "Featured in")}
                </div>
                <div className="display" style={{ fontSize: 38, lineHeight: 1, marginTop: 4 }}>
                  {c.title}
                </div>
                {c.description && (
                  <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
                    {c.description}
                  </div>
                )}
                <div style={{ marginTop: "auto", paddingTop: 24 }}>
                  <button
                    type="button"
                    onClick={() => navTo(`/products?item_list=${c.id}`)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: "var(--ink)",
                      color: "var(--bg)",
                      border: 0,
                      padding: "10px 16px",
                      borderRadius: 999,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {t("menu.browseAll", "Browse all")} {c.title}{" "}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function NavRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderRadius: "var(--radius-sm)",
        background: "transparent",
        border: 0,
        fontSize: 15,
        fontWeight: 500,
        textAlign: "left",
        cursor: "pointer",
        color: "var(--ink)",
      }}
    >
      {icon} {label}
    </button>
  );
}
