import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface WishlistItem {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  addedAt: string;
}

const WISHLIST_KEY = "ecommerce_wishlist";

// Get wishlist from localStorage
function getStoredWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(WISHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save wishlist to localStorage
function saveWishlist(items: WishlistItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load wishlist on mount
  useEffect(() => {
    setItems(getStoredWishlist());
    setIsLoaded(true);
  }, []);

  const addItem = useCallback(
    (item: Omit<WishlistItem, "addedAt">) => {
      setItems((prev) => {
        // Check if already in wishlist
        if (prev.some((i) => i.id === item.id)) {
          toast.info("Already in wishlist");
          return prev;
        }

        const newItem: WishlistItem = {
          ...item,
          addedAt: new Date().toISOString(),
        };
        const newItems = [...prev, newItem];
        saveWishlist(newItems);
        toast.success("Added to wishlist");
        return newItems;
      });
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const newItems = prev.filter((item) => item.id !== id);
      saveWishlist(newItems);
      toast.success("Removed from wishlist");
      return newItems;
    });
  }, []);

  const toggleItem = useCallback(
    (item: Omit<WishlistItem, "addedAt">) => {
      setItems((prev) => {
        const exists = prev.some((i) => i.id === item.id);
        if (exists) {
          const newItems = prev.filter((i) => i.id !== item.id);
          saveWishlist(newItems);
          toast.success("Removed from wishlist");
          return newItems;
        } else {
          const newItem: WishlistItem = {
            ...item,
            addedAt: new Date().toISOString(),
          };
          const newItems = [...prev, newItem];
          saveWishlist(newItems);
          toast.success("Added to wishlist");
          return newItems;
        }
      });
    },
    []
  );

  const isInWishlist = useCallback(
    (id: string) => {
      return items.some((item) => item.id === id);
    },
    [items]
  );

  const clearWishlist = useCallback(() => {
    setItems([]);
    saveWishlist([]);
    toast.success("Wishlist cleared");
  }, []);

  return {
    items,
    count: items.length,
    isLoaded,
    addItem,
    removeItem,
    toggleItem,
    isInWishlist,
    clearWishlist,
  };
}

// Simple hook for just the count
export function useWishlistCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const items = getStoredWishlist();
    setCount(items.length);

    // Listen for storage changes
    const handleStorage = () => {
      const items = getStoredWishlist();
      setCount(items.length);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return count;
}
