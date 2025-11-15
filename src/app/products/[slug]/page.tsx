"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StoreLayout } from "@/components/layout/store-layout";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { useLanguage } from "@/contexts/language-context";
import { useProductBySlug, useFeaturedProducts } from "@/hooks/use-products";
import { useAddToCart, useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/store-config";
import { toast } from "sonner";
import {
  ShoppingCart,
  Heart,
  Share2,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  Shield,
  Star,
  AlertCircle,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const config = useStoreConfig();
  const { t, getLocalizedValue, currentLanguage } = useLanguage();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, error } = useProductBySlug(slug, currentLanguage);
  const { data: relatedProducts } = useFeaturedProducts(4);
  const { data: cart } = useCart();
  const addToCart = useAddToCart();

  const handleAddToCart = () => {
    if (!cart) {
      toast.error("Cart not available. Please try again.");
      return;
    }
    if (product) {
      addToCart.mutate({
        cart: cart.id,
        product: product.id,
        quantity,
      });
    }
  };

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="container py-8">
          <Skeleton className="mb-8 h-6 w-64" />
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square w-20 rounded-md" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (error || !product) {
    return (
      <StoreLayout>
        <div className="container py-16 text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold">
            {t("common.noResults")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            The product you are looking for could not be found.
          </p>
          <Button asChild className="mt-6">
            <Link href="/products">{t("common.products")}</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  const productName = getLocalizedValue(product.name);
  // ProductList doesn't have description field, use short_description
  const productDescription = getLocalizedValue(product.short_description || "");
  const productShortDescription = getLocalizedValue(product.short_description || "");

  // ProductList uses single image field
  const productImages = [product.image || "/placeholder.svg"];

  const discountPercentage = product.discount_percentage || 0;

  return (
    <StoreLayout>
      <div className="container py-8">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            {t("common.home")}
          </Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-primary">
            {t("common.products")}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{productName}</span>
        </nav>

        {/* Product Details */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg border">
              <Image
                src={productImages[selectedImage] || "/placeholder.svg"}
                alt={productName}
                fill
                className="object-cover"
                priority
              />
              {discountPercentage > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute left-4 top-4 text-sm"
                >
                  {t("product.discount", { percent: discountPercentage })}
                </Badge>
              )}
            </div>
            {productImages.length > 1 && (
              <div className="flex gap-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square w-20 overflow-hidden rounded-md border ${
                      selectedImage === index
                        ? "ring-2 ring-primary"
                        : "hover:border-primary"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${productName} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2">
                {product.is_featured && (
                  <Badge className="bg-amber-500">{t("product.featured")}</Badge>
                )}
              </div>
              <h1 className="mt-2 text-3xl font-bold">{productName}</h1>
              {product.sku && (
                <p className="mt-2 text-muted-foreground">
                  {t("product.sku")}: {product.sku}
                </p>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">
                {formatPrice(
                  parseFloat(product.price),
                  config.locale.currency,
                  config.locale.locale
                )}
              </span>
              {product.compare_at_price &&
                parseFloat(product.compare_at_price) > parseFloat(product.price) && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(
                      parseFloat(product.compare_at_price),
                      config.locale.currency,
                      config.locale.locale
                    )}
                  </span>
                )}
            </div>

            {productShortDescription && (
              <p className="text-muted-foreground">{productShortDescription}</p>
            )}

            <Separator />

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("product.quantity")}</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setQuantity(Math.min(product.quantity || 99, quantity + 1))
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {(product.quantity || 0) > 0
                    ? t("product.inStock", { count: product.quantity || 0 })
                    : t("product.outOfStock")}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={(product.quantity || 0) === 0 || addToCart.isPending}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {t("common.addToCart")}
              </Button>
              {config.features.wishlist && (
                <Button size="lg" variant="outline">
                  <Heart className="h-5 w-5" />
                </Button>
              )}
              <Button size="lg" variant="outline">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            <Separator />

            {/* Features */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-5 w-5 text-primary" />
                <span>{t("home.freeShipping")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <RotateCcw className="h-5 w-5 text-primary" />
                <span>{t("home.easyReturns")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-5 w-5 text-primary" />
                <span>{t("home.securePayment")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">{t("product.description")}</TabsTrigger>
              <TabsTrigger value="specifications">{t("product.specifications")}</TabsTrigger>
              {config.features.reviews && (
                <TabsTrigger value="reviews">{t("product.reviews")}</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="description" className="mt-4">
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">{productDescription}</p>
              </div>
            </TabsContent>
            <TabsContent value="specifications" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {product.attribute_values && product.attribute_values.length > 0 ? (
                  product.attribute_values.map((attr, index) => (
                    <div
                      key={index}
                      className="flex justify-between rounded-lg bg-muted/50 p-4"
                    >
                      <span className="font-medium">
                        {getLocalizedValue(attr.attribute.name)}
                      </span>
                      <span className="text-muted-foreground">
                        {attr.value_text || attr.value || ""}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    No specifications available
                  </p>
                )}
              </div>
            </TabsContent>
            {config.features.reviews && (
              <TabsContent value="reviews" className="mt-4">
                <div className="text-center text-muted-foreground">
                  <Star className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-4">No reviews yet. Be the first to review!</p>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.results.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold">{t("product.relatedProducts")}</h2>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.results
                .filter((p) => p.id !== product.id)
                .slice(0, 4)
                .map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    id={String(relatedProduct.id)}
                    slug={relatedProduct.slug}
                    name={getLocalizedValue(relatedProduct.name)}
                    image={relatedProduct.image || "/placeholder.svg"}
                    price={parseFloat(relatedProduct.price)}
                    compareAtPrice={
                      relatedProduct.compare_at_price
                        ? parseFloat(relatedProduct.compare_at_price)
                        : undefined
                    }
                    isFeatured={relatedProduct.is_featured}
                    isOnSale={relatedProduct.discount_percentage > 0}
                    isNew={false}
                  />
                ))}
            </div>
          </section>
        )}
      </div>
    </StoreLayout>
  );
}
