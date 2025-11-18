"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { StoreLayout } from "@/components/layout/store-layout";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { useProducts } from "@/hooks/use-products";
import { Filter, SlidersHorizontal, Grid3X3, LayoutList } from "lucide-react";
import { useFilterableAttributes } from "@/hooks/use-attributes";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/language-context";
import type { PaginatedProductListList } from "@/api/generated/interfaces";

interface ProductsPageClientProps {
  initialData: PaginatedProductListList;
}

export function ProductsPageClient({ initialData }: ProductsPageClientProps) {
  const config = useStoreConfig();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, getLocalizedValue } = useLanguage();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 1000]);

  // Fetch filterable attributes
  const { data: filterableAttributes, isLoading: attributesLoading } =
    useFilterableAttributes();

  // Get filters from URL
  const filters: Record<string, any> = {
    search: searchParams.get("search") || undefined,
    minPrice: searchParams.get("min_price")
      ? Number(searchParams.get("min_price"))
      : undefined,
    maxPrice: searchParams.get("max_price")
      ? Number(searchParams.get("max_price"))
      : undefined,
    isFeatured: searchParams.get("is_featured") === "true" || undefined,
    onSale: searchParams.get("on_sale") === "true" || undefined,
    ordering: searchParams.get("ordering") || "-created_at",
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
  };

  // Dynamically add attribute filters from URL params
  searchParams.forEach((value, key) => {
    if (key.startsWith("attr_")) {
      filters[key] = value;
    }
  });

  // Use React Query for client-side updates (with initialData from server)
  const { data: productsData, isLoading } = useProducts(filters);

  // Use initialData from server on first render, then client data
  const displayData = productsData || initialData;

  const updateFilters = (newFilters: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`/products?${params.toString()}`);
  };

  const applyPriceFilter = () => {
    updateFilters({
      min_price: priceRange[0] > 0 ? String(priceRange[0]) : null,
      max_price: priceRange[1] < 1000 ? String(priceRange[1]) : null,
    });
  };

  const clearFilters = () => {
    router.push("/products");
    setPriceRange([0, 1000]);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Dynamic Attribute Filters */}
      {filterableAttributes && filterableAttributes.length > 0 && (
        <>
          {filterableAttributes.map((attr) => {
            const attrKey = `attr_${attr.key}`;
            const currentFilter = filters[attrKey] as string | undefined;

            return (
              <div key={attr.id} className="space-y-4">
                <Label className="font-semibold">
                  {getLocalizedValue(attr.name)}
                </Label>
                <div className="space-y-2">
                  {attr.options?.map((option: any, index: number) => {
                    // Use the value field for filtering, display name for UI
                    const optionValue =
                      typeof option === "string"
                        ? option
                        : option?.value || option?.en || "";
                    const optionLabel =
                      typeof option === "string"
                        ? option
                        : getLocalizedValue(option);
                    const isSelected = currentFilter === optionValue;

                    return (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${attr.key}-${index}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            updateFilters({
                              [attrKey]: checked ? optionValue : null,
                              page: null, // Reset page when filtering
                            });
                          }}
                        />
                        <label
                          htmlFor={`${attr.key}-${index}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {optionLabel}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <Separator />
        </>
      )}

      {/* Price Range */}
      <div className="space-y-4">
        <Label className="font-semibold">{t("productsPage.priceRange")}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={priceRange[0]}
            onChange={(e) =>
              setPriceRange([Number(e.target.value), priceRange[1]])
            }
            placeholder="Min"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            value={priceRange[1]}
            onChange={(e) =>
              setPriceRange([priceRange[0], Number(e.target.value)])
            }
            placeholder="Max"
          />
        </div>
        <Button onClick={applyPriceFilter} className="w-full">
          {t("productsPage.applyPriceFilter")}
        </Button>
      </div>

      <Separator />

      {/* Quick Filters */}
      <div className="space-y-4">
        <Label className="font-semibold">{t("productsPage.quickFilters")}</Label>
        <div className="space-y-2">
          <Button
            variant={filters.onSale ? "default" : "outline"}
            size="sm"
            className="w-full"
            onClick={() =>
              updateFilters({
                on_sale: filters.onSale ? null : "true",
              })
            }
          >
            {t("productsPage.onSale")}
          </Button>
          <Button
            variant={filters.isFeatured ? "default" : "outline"}
            size="sm"
            className="w-full"
            onClick={() =>
              updateFilters({
                is_featured: filters.isFeatured ? null : "true",
              })
            }
          >
            {t("product.featured")}
          </Button>
        </div>
      </div>

      <Separator />

      <Button variant="outline" onClick={clearFilters} className="w-full">
        {t("productsPage.clearAllFilters")}
      </Button>
    </div>
  );

  return (
    <StoreLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-3xl font-bold">
              {t("productsPage.title")}
            </h1>
            <p className="mt-1 text-xs md:text-base text-muted-foreground">
              {isLoading
                ? t("common.loading")
                : t("productsPage.productsFound", {
                    count: displayData?.count || 0,
                  })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Filter */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="overflow-y-auto p-4">
                <SheetHeader className="pb-2">
                  <SheetTitle>{t("productsPage.filters")}</SheetTitle>
                </SheetHeader>
                <div className="mt-2 pb-4">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort */}
            <Select
              value={filters.ordering}
              onValueChange={(value) => updateFilters({ ordering: value })}
            >
              <SelectTrigger className="h-10 w-[120px] md:w-[180px] text-xs md:text-sm">
                <SelectValue placeholder={t("productsPage.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-created_at" className="text-xs md:text-sm">
                  {t("productsPage.newest")}
                </SelectItem>
                <SelectItem value="price" className="text-xs md:text-sm">
                  {t("productsPage.priceLowToHigh")}
                </SelectItem>
                <SelectItem value="-price" className="text-xs md:text-sm">
                  {t("productsPage.priceHighToLow")}
                </SelectItem>
                <SelectItem value="name" className="text-xs md:text-sm">
                  {t("productsPage.nameAToZ")}
                </SelectItem>
                <SelectItem value="-name" className="text-xs md:text-sm">
                  {t("productsPage.nameZToA")}
                </SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="relative hidden items-center gap-0.5 rounded-lg bg-muted p-1 md:flex">
              {/* Sliding background indicator */}
              <div
                className={`absolute h-8 w-8 rounded-md bg-background shadow-sm transition-all duration-300 ease-in-out ${
                  viewMode === "grid"
                    ? "left-1"
                    : "left-[calc(50%+0.125rem)]"
                }`}
              />
              <Button
                variant="ghost"
                size="icon"
                className="relative z-10 h-8 w-8 rounded-md hover:bg-transparent"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative z-10 h-8 w-8 rounded-md hover:bg-transparent"
                onClick={() => setViewMode("list")}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-[240px_1fr]">
          {/* Desktop Filters Sidebar */}
          <div className="hidden md:block">
            <div className="sticky top-20 bg-background rounded-lg border p-4">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Filter className="h-5 w-5" />
                {t("productsPage.filters")}
              </h2>
              <FilterContent />
            </div>
          </div>

          {/* Products Grid */}
          <div>
            {isLoading ? (
              <div
                className={`grid gap-6 ${
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-1"
                }`}
              >
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : !displayData?.results?.length ? (
              <div className="py-12 text-center">
                <p className="text-lg text-muted-foreground">
                  {t("productsPage.noProductsFound")}
                </p>
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  {t("productsPage.clearFilters")}
                </Button>
              </div>
            ) : (
              <>
                <div
                  className={`grid gap-6 ${
                    viewMode === "grid"
                      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                      : "grid-cols-1"
                  }`}
                >
                  {displayData.results.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={String(product.id)}
                      slug={product.slug}
                      name={getLocalizedValue(product.name)}
                      image={product.image || "/placeholder.svg"}
                      price={parseFloat(product.price)}
                      compareAtPrice={
                        product.compare_at_price
                          ? parseFloat(product.compare_at_price)
                          : undefined
                      }
                      isOnSale={product.discount_percentage > 0}
                      isFeatured={product.is_featured}
                      isNew={false}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {displayData.count > 20 && (
                  <div className="mt-8 flex justify-center gap-2">
                    <Button
                      variant="outline"
                      disabled={!displayData.previous}
                      onClick={() =>
                        updateFilters({ page: String(filters.page - 1) })
                      }
                    >
                      {t("productsPage.previous")}
                    </Button>
                    <span className="flex items-center px-4">
                      {t("productsPage.page")} {filters.page}{" "}
                      {t("productsPage.of")} {Math.ceil(displayData.count / 20)}
                    </span>
                    <Button
                      variant="outline"
                      disabled={!displayData.next}
                      onClick={() =>
                        updateFilters({ page: String(filters.page + 1) })
                      }
                    >
                      {t("productsPage.next")}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
