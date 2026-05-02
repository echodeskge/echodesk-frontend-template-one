/**
 * Server-Side Fetch Utilities
 * Used in Server Components and generateMetadata functions
 * Cannot use localStorage or window - server-side only
 */

import { headers } from "next/headers";
import type {
  PaginatedProductListList,
  ProductDetail,
  ProductList,
} from "@/api/generated/interfaces";

/**
 * Get API URL for server-side requests
 * In multi-tenant mode, reads from x-tenant-api header set by middleware
 */
async function getServerApiUrl(): Promise<string> {
  // Try to get from middleware headers (multi-tenant mode)
  try {
    const headersList = await headers();
    const tenantApiUrl = headersList.get("x-tenant-api-url");
    if (tenantApiUrl) {
      return tenantApiUrl;
    }
  } catch {
    // headers() fails during ISR/static generation when there is no request context.
    // Fall through to environment variable fallback.
  }

  // Fallback to environment variable
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    return apiUrl;
  }

  // Default fallback to demo
  return "https://demo.api.echodesk.ge";
}

/**
 * Generic server-side fetch function
 */
async function serverFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  let baseURL: string;
  try {
    baseURL = await getServerApiUrl();
  } catch {
    // If getServerApiUrl fails entirely, use env var or default
    baseURL =
      process.env.NEXT_PUBLIC_API_URL || "https://demo.api.echodesk.ge";
  }

  const url = `${baseURL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      console.error(
        `Server fetch failed: ${response.status} ${response.statusText}`
      );
      throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Product filters interface
 */
export interface ProductFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  onSale?: boolean;
  ordering?: string;
  page?: number;
  language?: string;
  // Dynamic attribute filters
  [key: string]: string | number | boolean | undefined;
}

/**
 * Fetch products list with filters (server-side)
 */
export async function fetchProducts(
  filters: ProductFilters = {},
  revalidate?: number
): Promise<PaginatedProductListList> {
  const params = new URLSearchParams();

  // Add standard filters
  if (filters.search) params.append("search", filters.search);
  if (filters.minPrice !== undefined)
    params.append("min_price", String(filters.minPrice));
  if (filters.maxPrice !== undefined)
    params.append("max_price", String(filters.maxPrice));
  if (filters.isFeatured !== undefined)
    params.append("is_featured", String(filters.isFeatured));
  if (filters.onSale !== undefined)
    params.append("on_sale", String(filters.onSale));
  if (filters.ordering) params.append("ordering", filters.ordering);
  if (filters.page !== undefined) params.append("page", String(filters.page));
  if (filters.language) params.append("language", filters.language);

  // Add dynamic attribute filters (keys starting with attr_)
  Object.entries(filters).forEach(([key, value]) => {
    if (key.startsWith("attr_") && value !== undefined) {
      params.append(key, String(value));
    }
  });

  const queryString = params.toString();
  const endpoint = `/api/ecommerce/client/products/${queryString ? `?${queryString}` : ""}`;

  return serverFetch<PaginatedProductListList>(endpoint, {
    next: revalidate ? { revalidate } : undefined,
  });
}

/**
 * Fetch featured products (server-side)
 */
export async function fetchFeaturedProducts(
  limit?: number,
  revalidate?: number
): Promise<ProductList[]> {
  const data = await fetchProducts(
    { isFeatured: true },
    revalidate
  );
  return limit ? data.results.slice(0, limit) : data.results;
}

/**
 * Fetch products on sale (server-side)
 */
export async function fetchProductsOnSale(
  limit?: number,
  revalidate?: number
): Promise<ProductList[]> {
  const data = await fetchProducts({ onSale: true }, revalidate);
  return limit ? data.results.slice(0, limit) : data.results;
}

/**
 * Fetch single product by slug (server-side)
 * First finds the product in the list to get its ID, then fetches full detail
 * which includes variants, images, and description.
 */
export async function fetchProductBySlug(
  slug: string,
  language?: string,
  revalidate?: number
): Promise<ProductDetail | null> {
  try {
    const data = await fetchProducts(
      { search: slug, language },
      revalidate
    );

    // Find exact slug match
    const product = data.results.find((p) => p.slug === slug);
    if (!product) return null;

    // Fetch full product detail (includes variants, images, description)
    const detail = await serverFetch<ProductDetail>(
      `/api/ecommerce/client/products/${product.id}/`,
      { next: revalidate ? { revalidate } : undefined }
    );
    return detail;
  } catch (error) {
    console.error(`Error fetching product by slug ${slug}:`, error);
    return null;
  }
}

/**
 * Fetch all product slugs for static generation
 */
export async function fetchAllProductSlugs(): Promise<string[]> {
  try {
    // Fetch all products without pagination (you may need to handle pagination)
    const data = await fetchProducts({});
    return data.results.map((p) => p.slug);
  } catch (error) {
    console.error("Error fetching product slugs:", error);
    return [];
  }
}

/**
 * Sitemap entry for one product — slug + image + lastmod. Walks the
 * paginated /products endpoint until exhausted so the sitemap is
 * complete instead of just the first page (the previous helper bug).
 */
export interface SitemapProductEntry {
  slug: string;
  image: string | null;
  lastmod: string | null;
  /** Localized name (the multilang JSON or string from the API). */
  name: string | null;
}

export async function fetchAllProductsForSitemap(): Promise<SitemapProductEntry[]> {
  const all: SitemapProductEntry[] = [];
  try {
    let page = 1;
    // Cap at 100 pages so a misbehaving backend can't loop forever
    // here. At a typical page size of 24, that's 2400 products — well
    // above what fits in a single sitemap.xml file (50k limit) and
    // beyond what a single tenant carries today.
    while (page <= 100) {
      const data = await fetchProducts({ page }, 600);
      const items = data.results || [];
      for (const p of items) {
        all.push({
          slug: p.slug,
          image: p.image || null,
          lastmod: p.updated_at || p.created_at || null,
          name:
            typeof p.name === "string"
              ? p.name
              : p.name && typeof p.name === "object"
                ? (p.name as Record<string, string>).en ||
                  Object.values(p.name as Record<string, string>)[0] ||
                  null
                : null,
        });
      }
      if (!data.next) break;
      page += 1;
    }
  } catch (error) {
    console.error("Error fetching products for sitemap:", error);
  }
  return all;
}

/**
 * Fetch homepage sections (server-side)
 */
export type { HomepageSection } from "@/types/homepage";
import type { HomepageSection } from "@/types/homepage";

export async function fetchHomepageSections(
  revalidate?: number
): Promise<HomepageSection[]> {
  try {
    const endpoint = "/api/ecommerce/client/homepage/";
    const response = await serverFetch<{ sections: HomepageSection[] }>(endpoint, {
      next: revalidate ? { revalidate } : undefined,
    });
    return response.sections || [];
  } catch (error) {
    console.error("Error fetching homepage sections:", error);
    return [];
  }
}

/**
 * Fetch item lists/categories (server-side)
 */
export interface ItemList {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  items_count?: number;
}

export async function fetchItemLists(
  search?: string,
  revalidate?: number
): Promise<ItemList[]> {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);

    const queryString = params.toString();
    const endpoint = `/api/ecommerce/client/item-lists/${queryString ? `?${queryString}` : ""}`;

    const response = await serverFetch<{ results: ItemList[] }>(endpoint, {
      next: revalidate ? { revalidate } : undefined,
    });

    return response.results || [];
  } catch (error) {
    console.error("Error fetching item lists:", error);
    return [];
  }
}

/**
 * Fetch store configuration (server-side)
 */
export interface StoreConfig {
  name: string;
  description: string;
  logo: string;
  currency: string;
  language: string;
  contactEmail?: string;
  contactPhone?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export async function fetchStoreConfig(
  revalidate?: number
): Promise<StoreConfig | null> {
  try {
    const endpoint = "/api/ecommerce/client/config/";
    return serverFetch<StoreConfig>(endpoint, {
      next: revalidate ? { revalidate } : undefined,
    });
  } catch (error) {
    console.error("Error fetching store config:", error);
    return null;
  }
}

/**
 * Storefront template + Voltage tokens (server-side).
 * Decides which design the tenant renders before SSR so the first byte
 * already carries the right `<html data-template>` markers — kills the
 * flash where the classic shell renders for ~500ms before client-side
 * React Query swaps in Voltage.
 *
 * Cached for 5 minutes via Next's data cache; tagged so the admin can
 * call `revalidateTag('storefront-config')` after saving settings.
 */
export type StorefrontTemplate = "classic" | "voltage";

export interface StorefrontVoltageTokens {
  theme: string;
  mode: "light" | "dark";
  density: "compact" | "cozy" | "comfortable";
  radius: "sharp" | "soft" | "rounded";
  fontPair: string;
}

export interface StorefrontConfig {
  template: StorefrontTemplate;
  voltage: StorefrontVoltageTokens;
  /** The shop's configured display name (`store_name` on the theme
   * endpoint). Server-fetched and passed into the StoreConfigProvider
   * as an initial value so the header doesn't flash the schema name
   * ("groot") for ~200ms before the client-side fetch resolves. */
  storeName: string | null;
  /** Active chat widget token (`wgt_live_…`) for the tenant. Non-null
   * means the tenant has the embeddable chat enabled in
   * /settings/social-integrations on the admin — the storefront drops
   * in <script src="…/widget.js?t=TOKEN"> on every page so visitors
   * see the chat bubble automatically without the tenant pasting any
   * snippet. */
  chatWidgetToken: string | null;
  /** Per-tenant Google Ads / GA4 tracking. The storefront only injects
   * gtag.js when at least one of `googleAdsConversionId` /
   * `googleAnalyticsId` is non-empty. The `purchase` conversion
   * event on /order-confirmation only fires when both Google Ads
   * id + label are set — the label is the conversion-action suffix
   * that turns the bootstrap script into an actual conversion. */
  googleAdsConversionId: string | null;
  googleAdsPurchaseLabel: string | null;
  googleAnalyticsId: string | null;
  /** Pickup option — non-null when the tenant has enabled "Pickup at
   * store" and configured a pickup address. Storefront uses this to
   * show the "Pickup at store" choice in checkout step 1 and render
   * the pickup details to the customer. */
  pickup: {
    address: string;
    city: string;
    phone: string;
    contactName: string;
    extraInstructions: string;
  } | null;
}

const DEFAULT_STOREFRONT_CONFIG: StorefrontConfig = {
  template: "classic",
  voltage: {
    theme: "refurb",
    mode: "light",
    density: "cozy",
    radius: "soft",
    fontPair: "bricolage-inter",
  },
  storeName: null,
  chatWidgetToken: null,
  googleAdsConversionId: null,
  googleAdsPurchaseLabel: null,
  googleAnalyticsId: null,
  pickup: null,
};

export async function fetchStorefrontConfig(): Promise<StorefrontConfig> {
  try {
    const response = await serverFetch<{
      storefront?: Partial<Omit<StorefrontConfig, "storeName" | "chatWidgetToken" | "googleAdsConversionId" | "googleAdsPurchaseLabel" | "googleAnalyticsId" | "pickup">>;
      store_name?: string;
      chat_widget?: { token?: string | null };
      analytics?: {
        google_ads_conversion_id?: string | null;
        google_ads_purchase_label?: string | null;
        google_analytics_id?: string | null;
      };
      pickup?: {
        enabled?: boolean;
        address?: string;
        city?: string;
        phone?: string;
        contact_name?: string;
        extra_instructions?: string;
      };
    }>("/api/ecommerce/client/theme/", {
      next: { revalidate: 300, tags: ["storefront-config"] },
    });
    const sf = response.storefront;
    const pickup = response.pickup;
    return {
      template: sf?.template ?? "classic",
      voltage: {
        ...DEFAULT_STOREFRONT_CONFIG.voltage,
        ...(sf?.voltage ?? {}),
      },
      storeName: response.store_name ?? null,
      chatWidgetToken: response.chat_widget?.token ?? null,
      googleAdsConversionId: response.analytics?.google_ads_conversion_id || null,
      googleAdsPurchaseLabel: response.analytics?.google_ads_purchase_label || null,
      googleAnalyticsId: response.analytics?.google_analytics_id || null,
      pickup: pickup?.enabled
        ? {
            address: pickup.address || "",
            city: pickup.city || "",
            phone: pickup.phone || "",
            contactName: pickup.contact_name || "",
            extraInstructions: pickup.extra_instructions || "",
          }
        : null,
    };
  } catch (error) {
    console.error("Error fetching storefront config:", error);
    return DEFAULT_STOREFRONT_CONFIG;
  }
}
