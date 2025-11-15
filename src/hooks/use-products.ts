import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ecommerceClientProductsList,
  ecommerceClientProductsRetrieve,
  ecommerceClientAttributesList,
  ecommerceClientItemListsList,
  ecommerceClientItemListsRetrieve,
} from "@/api/generated/api";
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

// Hook for fetching products list with filters
export function useProducts(filters: ProductFilters = {}) {
  const {
    search,
    minPrice,
    maxPrice,
    isFeatured,
    onSale,
    ordering,
    page,
    language,
    ...attributeFilters
  } = filters;

  // For attribute filters, we need to pass them as attrXxx parameters
  const attrCategory = attributeFilters.attrCategory as string | undefined;
  const attrMaterial = attributeFilters.attrMaterial as string | undefined;
  const attrNumberOfLamps = attributeFilters.attrNumberOfLamps as string | undefined;
  const attrSubcategory = attributeFilters.attrSubcategory as string | undefined;

  return useQuery({
    queryKey: ["products", filters],
    queryFn: () =>
      ecommerceClientProductsList(
        attrCategory,
        attrMaterial,
        attrNumberOfLamps,
        attrSubcategory,
        isFeatured,
        language,
        maxPrice,
        minPrice,
        onSale,
        ordering,
        page,
        search
      ),
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
