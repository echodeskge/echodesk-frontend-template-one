import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ecommerceClientProductsRetrieve } from "@/api/generated/api";

/**
 * Guest (unauthenticated) cart, persisted in `localStorage` under the
 * `guest_cart` key. Mirrors enough of the authenticated useCart() /
 * useCartItems() shape that consumers can render the same UI for both.
 *
 * The same `guest_cart` key is read by the classic checkout flow's
 * `handleGuestCheckout` so visitors who add items while logged-out can
 * complete a guest checkout without losing their selection.
 */

const STORAGE_KEY = "guest_cart";

export interface GuestCartItem {
  product_id: number;
  quantity: number;
}

const readGuestCart = (): GuestCartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (it): it is GuestCartItem =>
        it &&
        typeof it === "object" &&
        typeof it.product_id === "number" &&
        typeof it.quantity === "number" &&
        it.quantity > 0,
    );
  } catch {
    return [];
  }
};

const writeGuestCart = (items: GuestCartItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    // Cross-tab sync. Same-tab listeners get notified via the
    // `guest-cart-changed` custom event below.
    window.dispatchEvent(new CustomEvent("guest-cart-changed"));
  } catch {
    /* quota / private mode — just fail silent */
  }
};

const upsertItem = (items: GuestCartItem[], productId: number, quantity: number): GuestCartItem[] => {
  const existing = items.find((i) => i.product_id === productId);
  if (existing) {
    return items.map((i) =>
      i.product_id === productId ? { ...i, quantity: Math.max(1, i.quantity + quantity) } : i,
    );
  }
  if (quantity <= 0) return items;
  return [...items, { product_id: productId, quantity }];
};

const setItemQty = (items: GuestCartItem[], productId: number, quantity: number): GuestCartItem[] => {
  if (quantity <= 0) return items.filter((i) => i.product_id !== productId);
  return items.map((i) => (i.product_id === productId ? { ...i, quantity } : i));
};

const removeItemId = (items: GuestCartItem[], productId: number): GuestCartItem[] =>
  items.filter((i) => i.product_id !== productId);

/**
 * Subscribe to localStorage changes (across tabs + same tab via the
 * custom event we dispatch on writes). Forces consumers to re-render
 * when the guest cart updates.
 */
function useGuestCartItems(): GuestCartItem[] {
  const [items, setItems] = useState<GuestCartItem[]>([]);

  useEffect(() => {
    setItems(readGuestCart());
    const onChange = () => setItems(readGuestCart());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) onChange();
    };
    window.addEventListener("guest-cart-changed", onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("guest-cart-changed", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return items;
}

/**
 * Hydrated guest cart — joins localStorage line items with the product
 * detail API so the cart page can render names + images + prices
 * without storing a stale snapshot in localStorage. Each product is
 * fetched once and cached by React Query for 5 min.
 */
export interface GuestCartHydrated {
  isLoading: boolean;
  items: Array<{
    id: string;
    product_id: number;
    quantity: number;
    name: any;
    image: string | null;
    price: number;
    slug: string;
    subtotal: number;
  }>;
  total_items: number;
  total: number;
}

export function useHydratedGuestCart(): GuestCartHydrated {
  const lines = useGuestCartItems();

  const queries = useQuery({
    queryKey: ["guest-cart-products", lines.map((l) => l.product_id).sort().join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        lines.map((l) =>
          ecommerceClientProductsRetrieve(l.product_id).catch(() => null),
        ),
      );
      return results;
    },
    enabled: lines.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return useMemo(() => {
    const products = queries.data ?? [];
    const items = lines.map((line) => {
      const product = products.find((p) => p && p.id === line.product_id);
      const price = product ? Number(product.price) : 0;
      return {
        id: `guest-${line.product_id}`,
        product_id: line.product_id,
        quantity: line.quantity,
        name: product?.name ?? null,
        image: product?.image ?? null,
        price,
        slug: product?.slug ?? "",
        subtotal: price * line.quantity,
      };
    });
    return {
      isLoading: queries.isLoading,
      items,
      total_items: items.reduce((s, it) => s + it.quantity, 0),
      total: items.reduce((s, it) => s + it.subtotal, 0),
    };
  }, [lines, queries.data, queries.isLoading]);
}

/**
 * Imperative mutators used by add-to-cart buttons / cart row UI.
 */
export function useGuestCartMutations() {
  const qc = useQueryClient();

  const invalidate = useCallback(() => {
    // Invalidate any queries that depend on the guest cart (so cart
    // count badge / cart page / header all refresh).
    qc.invalidateQueries({ queryKey: ["guest-cart-products"] });
  }, [qc]);

  const addItem = useCallback(
    (productId: number, quantity = 1) => {
      writeGuestCart(upsertItem(readGuestCart(), productId, quantity));
      invalidate();
    },
    [invalidate],
  );

  const setQuantity = useCallback(
    (productId: number, quantity: number) => {
      writeGuestCart(setItemQty(readGuestCart(), productId, quantity));
      invalidate();
    },
    [invalidate],
  );

  const removeItem = useCallback(
    (productId: number) => {
      writeGuestCart(removeItemId(readGuestCart(), productId));
      invalidate();
    },
    [invalidate],
  );

  const clear = useCallback(() => {
    writeGuestCart([]);
    invalidate();
  }, [invalidate]);

  return { addItem, setQuantity, removeItem, clear };
}

/**
 * Cart count for header badge — reads localStorage directly so it's
 * accurate even before the product detail fetches resolve.
 */
export function useGuestCartCount(): number {
  const items = useGuestCartItems();
  return items.reduce((s, it) => s + it.quantity, 0);
}
