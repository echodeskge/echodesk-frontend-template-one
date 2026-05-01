"use client";

/*
 * Voltage SearchModal — centered overlay triggered by the header search
 * button. Real product search via `useProducts({ search })`. Debounced
 * to keep the API quiet while the user types.
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { useLanguage } from "@/contexts/language-context";
import { useTranslate } from "./use-translate";

interface SearchModalProps {
  onClose: () => void;
}

export function SearchModal({ onClose }: SearchModalProps) {
  const t = useTranslate();
  const router = useRouter();
  const { getLocalizedValue } = useLanguage();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(handle);
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { data: productsData, isFetching } = useProducts({
    search: debounced || undefined,
    page: 1,
  });
  const results = (productsData?.results ?? []).slice(0, 8);

  const localizedName = (val: unknown): string => {
    if (typeof val === "string") return val;
    if (val && typeof val === "object") return getLocalizedValue(val as Record<string, string>);
    return "";
  };

  const handleSelect = (slug: string) => {
    onClose();
    router.push(`/products/${slug}`);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "color-mix(in oklch, var(--ink) 60%, transparent)",
        zIndex: 100,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "40px 16px",
        animation: "fadein .2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 100%)",
          background: "var(--bg)",
          border: "1.5px solid var(--ink)",
          borderRadius: "var(--radius)",
          padding: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 12px",
            borderBottom: "1.5px solid var(--line)",
          }}
        >
          <Search className="h-5 w-5" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search.placeholder", "Search products, brands…")}
            style={{
              flex: 1,
              border: 0,
              background: "transparent",
              outline: "none",
              fontSize: 16,
              padding: "12px 0",
              minWidth: 0,
              color: "var(--ink)",
            }}
          />
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "var(--muted)",
              border: "1.5px solid var(--line)",
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <X className="h-3 w-3" /> ESC
          </button>
        </div>

        <div
          style={{
            padding: "12px 4px",
            display: "grid",
            gap: 8,
            maxHeight: 420,
            overflowY: "auto",
          }}
        >
          {isFetching && results.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", opacity: 0.5, fontSize: 13 }}>
              {t("search.loading", "Searching…")}
            </div>
          )}
          {!isFetching && results.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", opacity: 0.5, fontSize: 13 }}>
              {debounced
                ? t("search.empty", "No products match your search.")
                : t("search.hint", "Type to search.")}
            </div>
          )}
          {results.map((p) => {
            const name = localizedName(p.name);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p.slug)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "48px 1fr auto",
                  gap: 12,
                  alignItems: "center",
                  padding: 8,
                  borderRadius: "var(--radius-sm)",
                  border: 0,
                  background: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--muted)",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {p.image && (
                    <Image
                      src={p.image}
                      alt={name}
                      fill
                      sizes="48px"
                      style={{ objectFit: "cover" }}
                    />
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {name}
                  </div>
                  <div className="mono" style={{ fontSize: 11, opacity: 0.5 }}>
                    {p.sku}
                  </div>
                </div>
                <div className="mono" style={{ fontWeight: 700, fontSize: 14 }}>
                  {Number(p.price).toFixed(0)}₾
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
