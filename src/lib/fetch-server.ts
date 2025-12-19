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
    const tenantApiUrl = headersList.get("x-tenant-api");
    if (tenantApiUrl) {
      return tenantApiUrl;
    }
  } catch (e) {
    // headers() might fail in some contexts
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
  const baseURL = await getServerApiUrl();
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
 */
export async function fetchProductBySlug(
  slug: string,
  language?: string,
  revalidate?: number
): Promise<ProductList | null> {
  try {
    const data = await fetchProducts(
      { search: slug, language },
      revalidate
    );

    // Find exact slug match
    const product = data.results.find((p) => p.slug === slug);
    return product || null;
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
 * Fetch homepage sections (server-side)
 */
export interface HomepageSection {
  id: number;
  title: string;
  type: string;
  order: number;
  content: any;
}

export async function fetchHomepageSections(
  revalidate?: number
): Promise<HomepageSection[]> {
  try {
    const endpoint = "/api/ecommerce/client/homepage-sections/";
    return serverFetch<HomepageSection[]>(endpoint, {
      next: revalidate ? { revalidate } : undefined,
    });
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
