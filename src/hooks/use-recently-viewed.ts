"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "recently_viewed";
const MAX_ITEMS = 10;

export interface RecentlyViewedProduct {
  id: number;
  slug: string;
  name: string;
  image: string;
  price: string;
}

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentlyViewed(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const addToRecentlyViewed = useCallback((product: RecentlyViewedProduct) => {
    setRecentlyViewed((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((p) => p.id !== product.id);
      // Add to front
      const updated = [product, ...filtered].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  }, []);

  const getRecentlyViewed = useCallback((): RecentlyViewedProduct[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  }, []);

  return { recentlyViewed, addToRecentlyViewed, getRecentlyViewed };
}
