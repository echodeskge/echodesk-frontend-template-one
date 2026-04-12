"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/language-context";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { formatPrice } from "@/lib/store-config";
import axiosInstance from "@/api/axios";

interface SearchResult {
  id: number;
  slug: string;
  name: any;
  image?: string;
  price: string;
}

export function SearchAutocomplete() {
  const { t, getLocalizedValue } = useLanguage();
  const config = useStoreConfig();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
      const response = await axiosInstance.get(
        `/api/ecommerce/client/products/?search=${encodeURIComponent(searchQuery)}&page_size=5`
      );
      const data = response.data;
      const products: SearchResult[] = data.results || [];
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

  // Close dropdown on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleResultClick = (slug: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/products/${slug}`);
  };

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
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
          />
          {isLoading && (
            <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </form>

      {/* Dropdown results */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-md border bg-background shadow-lg md:w-[300px] lg:w-[400px]">
          {results.map((product) => (
            <button
              key={product.id}
              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors"
              onClick={() => handleResultClick(product.slug)}
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border bg-muted">
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={getLocalizedValue(product.name)}
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
