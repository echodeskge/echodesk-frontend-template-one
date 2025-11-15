"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { StoreLayout } from "@/components/layout/store-layout";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
import { formatPrice } from "@/lib/store-config";
import { useProducts } from "@/hooks/use-products";
import { Filter, SlidersHorizontal, Grid3X3, LayoutList } from "lucide-react";
import { useFilterableAttributes } from "@/hooks/use-attributes";
import { Checkbox } from "@/components/ui/checkbox";

function ProductsContent() {
  const config = useStoreConfig();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 1000]);

  // Fetch filterable attributes
  const { data: filterableAttributes, isLoading: attributesLoading } =
    useFilterableAttributes();

  // Get filters from URL
  const filters = {
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
    // Get category filter from URL
    attrCategory: searchParams.get("attr_category") || undefined,
  };

  const { data: productsData, isLoading } = useProducts(filters);

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
      {/* Category Filter */}
      {filterableAttributes && filterableAttributes.length > 0 && (
        <>
          {filterableAttributes.map((attr) => (
            <div key={attr.id} className="space-y-4">
              <Label className="font-semibold">
                {typeof attr.name === "string"
                  ? attr.name
                  : attr.name?.en || attr.key}
              </Label>
              <div className="space-y-2">
                {attr.options?.map((option: any, index: number) => {
                  const optionValue =
                    typeof option === "string" ? option : option?.en || "";
                  const isSelected = filters.attrCategory === optionValue;

                  return (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${attr.key}-${index}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          updateFilters({
                            attr_category: checked ? optionValue : null,
                            page: null, // Reset page when filtering
                          });
                        }}
                      />
                      <label
                        htmlFor={`${attr.key}-${index}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {optionValue}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <Separator />
        </>
      )}

      {/* Price Range */}
      <div className="space-y-4">
        <Label className="font-semibold">Price Range</Label>
        <Slider
          value={priceRange}
          min={0}
          max={1000}
          step={10}
          onValueChange={setPriceRange}
          className="py-4"
        />
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={priceRange[0]}
            onChange={(e) =>
              setPriceRange([Number(e.target.value), priceRange[1]])
            }
            className="w-24"
          />
          <span>-</span>
          <Input
            type="number"
            value={priceRange[1]}
            onChange={(e) =>
              setPriceRange([priceRange[0], Number(e.target.value)])
            }
            className="w-24"
          />
        </div>
        <Button onClick={applyPriceFilter} className="w-full">
          Apply Price Filter
        </Button>
      </div>

      <Separator />

      {/* Quick Filters */}
      <div className="space-y-4">
        <Label className="font-semibold">Quick Filters</Label>
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
            On Sale
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
            Featured
          </Button>
        </div>
      </div>

      <Separator />

      <Button variant="outline" onClick={clearFilters} className="w-full">
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <StoreLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="mt-1 text-muted-foreground">
              {isLoading
                ? "Loading..."
                : `${productsData?.count || 0} products found`}
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
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort */}
            <Select
              value={filters.ordering}
              onValueChange={(value) => updateFilters({ ordering: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-created_at">Newest</SelectItem>
                <SelectItem value="price">Price: Low to High</SelectItem>
                <SelectItem value="-price">Price: High to Low</SelectItem>
                <SelectItem value="name">Name: A to Z</SelectItem>
                <SelectItem value="-name">Name: Z to A</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="hidden items-center gap-1 rounded-md border p-1 md:flex">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
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
            <div className="sticky top-20">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Filter className="h-5 w-5" />
                Filters
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
            ) : !productsData?.results?.length ? (
              <div className="py-12 text-center">
                <p className="text-lg text-muted-foreground">No products found</p>
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Clear Filters
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
                  {productsData.results.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={String(product.id)}
                      slug={product.slug}
                      name={
                        typeof product.name === "string"
                          ? product.name
                          : product.name?.en || "Product"
                      }
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
                {productsData.count > 20 && (
                  <div className="mt-8 flex justify-center gap-2">
                    <Button
                      variant="outline"
                      disabled={!productsData.previous}
                      onClick={() =>
                        updateFilters({ page: String(filters.page - 1) })
                      }
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4">
                      Page {filters.page} of{" "}
                      {Math.ceil(productsData.count / 20)}
                    </span>
                    <Button
                      variant="outline"
                      disabled={!productsData.next}
                      onClick={() =>
                        updateFilters({ page: String(filters.page + 1) })
                      }
                    >
                      Next
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

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <StoreLayout>
          <div className="container py-8">
            <Skeleton className="h-10 w-48 mb-8" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </StoreLayout>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
