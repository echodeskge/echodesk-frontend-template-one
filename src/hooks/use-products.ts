import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ecommerceClientProductsList,
  ecommerceClientProductsRetrieve,
  ecommerceClientAttributesList,
  ecommerceClientItemListsList,
  ecommerceClientItemListsRetrieve,
} from "@/api/generated/api";
import axios from "@/api/axios";
import type {
  PaginatedProductListList,
  ProductDetail,
  ProductList,
} from "@/api/generated/interfaces";

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

// Custom function to fetch products with dynamic attribute filters
async function fetchProductsWithFilters(
  filters: ProductFilters
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
  const url = `/api/ecommerce/client/products/${queryString ? `?${queryString}` : ""}`;
  const response = await axios.get(url);
  return response.data;
}

// Hook for fetching products list with filters
export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => fetchProductsWithFilters(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook for fetching featured products
export function useFeaturedProducts(limit?: number) {
  return useQuery({
    queryKey: ["products", "featured", limit],
    queryFn: () =>
      ecommerceClientProductsList(
        undefined, // attrCategory
        undefined, // attrMaterial
        undefined, // attrNumberOfLamps
        undefined, // attrSubcategory
        true, // isFeatured
        undefined, // language
        undefined, // maxPrice
        undefined, // minPrice
        undefined, // onSale
        undefined, // ordering
        undefined, // page
        undefined // search
      ),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => ({
      ...data,
      results: limit ? data.results.slice(0, limit) : data.results,
    }),
  });
}

// Hook for fetching products on sale
export function useProductsOnSale(limit?: number) {
  return useQuery({
    queryKey: ["products", "onSale", limit],
    queryFn: () =>
      ecommerceClientProductsList(
        undefined, // attrCategory
        undefined, // attrMaterial
        undefined, // attrNumberOfLamps
        undefined, // attrSubcategory
        undefined, // isFeatured
        undefined, // language
        undefined, // maxPrice
        undefined, // minPrice
        true, // onSale
        undefined, // ordering
        undefined, // page
        undefined // search
      ),
    staleTime: 5 * 60 * 1000,
    select: (data) => ({
      ...data,
      results: limit ? data.results.slice(0, limit) : data.results,
    }),
  });
}

// Hook for fetching single product by ID
export function useProduct(id: number | null) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => ecommerceClientProductsRetrieve(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for fetching single product by slug
export function useProductBySlug(slug: string | null, language?: string) {
  return useQuery({
    queryKey: ["product", "slug", slug, language],
    queryFn: async () => {
      if (!slug) {
        throw new Error("Slug is required");
      }
      // Search for product by slug
      const result = await ecommerceClientProductsList(
        undefined, // attrCategory
        undefined, // attrMaterial
        undefined, // attrNumberOfLamps
        undefined, // attrSubcategory
        undefined, // isFeatured
        language, // language
        undefined, // maxPrice
        undefined, // minPrice
        undefined, // onSale
        undefined, // ordering
        undefined, // page
        slug // search - will match against slug
      );
      // Find exact slug match
      const product = result.results.find((p) => p.slug === slug);
      if (!product) {
        throw new Error("Product not found");
      }
      return product;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for fetching product attributes (for filters)
export function useProductAttributes() {
  return useQuery({
    queryKey: ["productAttributes"],
    queryFn: () => ecommerceClientAttributesList(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for fetching item lists (categories/collections)
export function useItemLists(search?: string) {
  return useQuery({
    queryKey: ["itemLists", search],
    queryFn: () => ecommerceClientItemListsList(undefined, undefined, search),
    staleTime: 10 * 60 * 1000,
  });
}

// Hook for fetching single item list
export function useItemList(id: number | null) {
  return useQuery({
    queryKey: ["itemList", id],
    queryFn: () => ecommerceClientItemListsRetrieve(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}
