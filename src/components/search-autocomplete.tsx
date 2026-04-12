"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/language-context";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { formatPrice } from "@/lib/store-config";
import { ecommerceClientProductsList } from "@/api/generated/api";
import type { ProductList } from "@/api/generated/interfaces";

export function SearchAutocomplete() {
  const { t, getLocalizedValue } = useLanguage();
  const config = useStoreConfig();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductList[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResults = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await ecommerceClientProductsList(
        undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, 5, searchQuery
      );
      const products = data.results || [];
      setResults(products);
      setIsOpen(products.length > 0);
    } catch {
      setResults([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchResults(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, fetchResults]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleResultClick = useCallback((slug: string) => {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(-1);
    router.push(`/products/${slug}`);
  }, [router]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setActiveIndex(-1);
      }
      if (!isOpen) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, -1));
      } else if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        handleResultClick(results[activeIndex].slug);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeIndex, results, handleResultClick]);

  return (
    <div ref={containerRef} className="relative w-full flex-1 md:w-auto md:flex-none">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("common.search")}
            className="w-full pl-8 md:w-[200px] lg:w-[300px]"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-autocomplete="list"
          />
          {isLoading && (
            <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </form>

      {/* Dropdown results */}
      {isOpen && results.length > 0 && (
        <div
          role="listbox"
          aria-label={t("common.search")}
          className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-md border bg-background shadow-lg md:w-[300px] lg:w-[400px]"
        >
          {results.map((product, index) => (
            <button
              key={product.id}
              role="option"
              aria-selected={index === activeIndex}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                index === activeIndex ? "bg-muted" : "hover:bg-muted"
              }`}
              onClick={() => handleResultClick(product.slug)}
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border bg-muted">
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={getLocalizedValue(product.name) || "Product"}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">
                  {getLocalizedValue(product.name)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(
                    parseFloat(product.price),
                    config.locale.currency,
                    config.locale.locale
                  )}
                </p>
              </div>
            </button>
          ))}
          {query.trim() && (
            <button
              className="flex w-full items-center justify-center gap-2 border-t px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
              onClick={() => {
                setIsOpen(false);
                router.push(`/products?search=${encodeURIComponent(query.trim())}`);
              }}
            >
              <Search className="h-3 w-3" />
              {t("common.viewAll")} &quot;{query.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
