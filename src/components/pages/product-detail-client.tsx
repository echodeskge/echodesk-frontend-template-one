"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StoreLayout } from "@/components/layout/store-layout";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { useAddToCart, useCart } from "@/hooks/use-cart";
import { useBackendWishlist } from "@/hooks/use-favorites";
import { formatPrice } from "@/lib/store-config";
import { cn } from "@/lib/utils";
import axiosInstance from "@/api/axios";
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
  Loader2,
} from "lucide-react";
import type {
  ProductDetail,
  ProductList,
  ProductVariant,
} from "@/api/generated/interfaces";

interface ProductDetailClientProps {
  product: ProductDetail;
  relatedProducts: ProductList[];
}

function renderStars(rating: number) {
  return [1, 2, 3, 4, 5].map((star) => (
    <Star
      key={star}
      className={cn(
        "h-4 w-4",
        star <= rating
          ? "fill-yellow-400 text-yellow-400"
          : "text-gray-300"
      )}
    />
  ));
}

export function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailClientProps) {
  const config = useStoreConfig();
  const { t, getLocalizedValue } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Variant selection state
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});

  // Review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const { data: cart } = useCart();
  const addToCart = useAddToCart();
  const { toggleWishlist, isInWishlist, isPending: isWishlistPending } =
    useBackendWishlist();

  // --- Variant Logic ---
  const variantAttributes = useMemo(() => {
    const attrs: Record<string, Set<string>> = {};
    product.variants?.forEach((v) => {
      if (!v.is_active) return;
      v.attribute_values?.forEach((av) => {
        const attrName = getLocalizedValue(av.attribute.name);
        if (!attrs[attrName]) attrs[attrName] = new Set();
        // value_json can be a string or other type
        const val =
          typeof av.value_json === "string"
            ? av.value_json
            : JSON.stringify(av.value_json);
        attrs[attrName].add(val);
      });
    });
    return attrs;
  }, [product.variants, getLocalizedValue]);

  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!product.variants?.length) return null;
    const attrKeys = Object.keys(selectedAttributes);
    if (attrKeys.length === 0) return null;
    return (
      product.variants.find((v) => {
        if (!v.is_active) return false;
        return v.attribute_values?.every((av) => {
          const attrName = getLocalizedValue(av.attribute.name);
          const val =
            typeof av.value_json === "string"
              ? av.value_json
              : JSON.stringify(av.value_json);
          return selectedAttributes[attrName] === val;
        });
      }) || null
    );
  }, [product.variants, selectedAttributes, getLocalizedValue]);

  const displayPrice = selectedVariant?.effective_price || product.price;
  const displayStock = selectedVariant?.quantity ?? product.quantity;

  // --- Image Gallery Logic ---
  const allImages = useMemo(() => {
    const imgs: string[] = [];
    if (product.image) imgs.push(product.image);
    if (product.images) {
      product.images.forEach((img) => {
        if (img.image && !imgs.includes(img.image)) imgs.push(img.image);
      });
    }
    // Add variant image if different
    if (selectedVariant?.image && !imgs.includes(selectedVariant.image)) {
      imgs.unshift(selectedVariant.image);
    }
    return imgs;
  }, [product, selectedVariant]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Switch image when variant changes
  useEffect(() => {
    if (selectedVariant?.image) {
      const idx = allImages.indexOf(selectedVariant.image);
      if (idx >= 0) setSelectedImageIndex(idx);
    }
  }, [selectedVariant, allImages]);

  // --- Reviews Logic ---
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ["product-reviews", product.id],
    queryFn: () =>
      axiosInstance
        .get(`/api/ecommerce/client/products/${product.id}/reviews/`)
        .then((r) => r.data),
    retry: false,
  });

  const reviews: any[] = reviewsData?.results || reviewsData || [];

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce(
      (acc: number, r: any) => acc + (r.rating || 0),
      0
    );
    return sum / reviews.length;
  }, [reviews]);

  const submitReviewMutation = useMutation({
    mutationFn: (data: {
      rating: number;
      title?: string;
      content?: string;
    }) =>
      axiosInstance.post(
        `/api/ecommerce/client/products/${product.id}/reviews/`,
        data
      ),
    onSuccess: () => {
      toast.success("Review submitted successfully!");
      setReviewRating(0);
      setReviewTitle("");
      setReviewContent("");
      refetchReviews();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || "Failed to submit review";
      toast.error(message);
    },
  });

  const submitReview = () => {
    if (!reviewRating) return;
    submitReviewMutation.mutate({
      rating: reviewRating,
      ...(reviewTitle ? { title: reviewTitle } : {}),
      ...(reviewContent ? { content: reviewContent } : {}),
    });
  };

  // --- Add to Cart ---
  const handleAddToCart = () => {
    // If variants exist but none selected, prompt user
    if (
      product.variants?.length &&
      Object.keys(variantAttributes).length > 0 &&
      !selectedVariant
    ) {
      toast.error("Please select all variant options before adding to cart.");
      return;
    }

    if (!isAuthenticated) {
      setPendingAction(() => () => {
        if (cart && product) {
          addToCart.mutate({
            cart: cart.id,
            product: product.id,
            quantity,
            ...(selectedVariant ? { variant: selectedVariant.id } : {}),
          });
        }
      });
      setShowLoginDialog(true);
      return;
    }

    if (!cart) {
      toast.error("Cart not available. Please try again.");
      return;
    }
    if (product) {
      addToCart.mutate({
        cart: cart.id,
        product: product.id,
        quantity,
        ...(selectedVariant ? { variant: selectedVariant.id } : {}),
      });
    }
  };

  const handleLoginSuccess = () => {
    if (pendingAction) {
      setTimeout(() => {
        pendingAction();
        setPendingAction(null);
      }, 500);
    }
  };

  const productName = getLocalizedValue(product.name);
  const productDescription = getLocalizedValue(product.description || "");
  const productShortDescription = getLocalizedValue(
    product.short_description || ""
  );

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
          {/* Image Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-lg border bg-gray-100">
              <Image
                src={allImages[selectedImageIndex] || "/placeholder.svg"}
                alt={productName}
                fill
                className="object-contain"
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
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      "relative aspect-square w-16 shrink-0 overflow-hidden rounded-md border-2",
                      index === selectedImageIndex
                        ? "border-primary"
                        : "border-transparent hover:border-muted-foreground/30"
                    )}
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
                  parseFloat(displayPrice),
                  config.locale.currency,
                  config.locale.locale
                )}
              </span>
              {product.compare_at_price &&
                parseFloat(product.compare_at_price) >
                  parseFloat(displayPrice) && (
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

            {/* Variant Selectors */}
            {Object.keys(variantAttributes).length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  {Object.entries(variantAttributes).map(
                    ([attrName, values]) => (
                      <div key={attrName} className="space-y-2">
                        <label className="text-sm font-medium">
                          {attrName}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[...values].map((value) => (
                            <Button
                              key={value}
                              variant={
                                selectedAttributes[attrName] === value
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                setSelectedAttributes((prev) => ({
                                  ...prev,
                                  [attrName]: value,
                                }))
                              }
                            >
                              {value}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                  {selectedVariant && (
                    <p className="text-sm text-muted-foreground">
                      SKU: {selectedVariant.sku}
                    </p>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("product.quantity")}
              </label>
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
                    setQuantity(Math.min(displayStock || 99, quantity + 1))
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {(displayStock || 0) > 0
                    ? t("product.inStock", { count: displayStock || 0 })
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
                disabled={(displayStock || 0) === 0 || addToCart.isPending}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {t("common.addToCart")}
              </Button>
              {config.features.wishlist && product && (
                <Button
                  size="lg"
                  variant="outline"
                  className={isInWishlist(product.id) ? "text-red-500" : ""}
                  onClick={() => toggleWishlist(product.id)}
                  disabled={isWishlistPending}
                >
                  {isWishlistPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Heart
                      className={`h-5 w-5 ${
                        isInWishlist(product.id) ? "fill-current" : ""
                      }`}
                    />
                  )}
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
              <TabsTrigger value="description">
                {t("product.description")}
              </TabsTrigger>
              <TabsTrigger value="specifications">
                {t("product.specifications")}
              </TabsTrigger>
              {config.features.reviews && (
                <TabsTrigger value="reviews">
                  {t("product.reviews")}
                  {reviews.length > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({reviews.length})
                    </span>
                  )}
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="description" className="mt-4">
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">{productDescription}</p>
              </div>
            </TabsContent>
            <TabsContent value="specifications" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {product.attribute_values &&
                product.attribute_values.length > 0 ? (
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
                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Star className="mx-auto h-12 w-12 opacity-50" />
                    <p className="mt-4">
                      No reviews yet. Be the first to review!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Average rating summary */}
                    <div className="flex items-center gap-4 pb-4 border-b">
                      <div className="text-4xl font-bold">
                        {averageRating.toFixed(1)}
                      </div>
                      <div>
                        <div className="flex">{renderStars(Math.round(averageRating))}</div>
                        <p className="text-sm text-muted-foreground">
                          {reviews.length}{" "}
                          {reviews.length === 1 ? "review" : "reviews"}
                        </p>
                      </div>
                    </div>
                    {/* Individual reviews */}
                    {reviews.map((review: any) => (
                      <div key={review.id} className="border-b pb-4">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {renderStars(review.rating)}
                          </div>
                          {review.is_verified_purchase && (
                            <Badge
                              variant="secondary"
                              className="text-xs"
                            >
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                        {review.title && (
                          <h4 className="font-medium mt-1">{review.title}</h4>
                        )}
                        {review.content && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {review.content}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {review.reviewer_name && (
                            <span className="font-medium mr-2">
                              {review.reviewer_name}
                            </span>
                          )}
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Review submission form */}
                {isAuthenticated && (
                  <div className="mt-6 border-t pt-6">
                    <h3 className="font-medium mb-3">Write a Review</h3>
                    <div className="space-y-3">
                      {/* Star rating input */}
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Rating
                        </label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="focus:outline-none"
                            >
                              <Star
                                className={cn(
                                  "h-6 w-6 transition-colors",
                                  star <= (hoverRating || reviewRating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                )}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <Input
                        placeholder="Review title (optional)"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                      />
                      <Textarea
                        placeholder="Share your experience..."
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        rows={4}
                      />
                      <Button
                        onClick={submitReview}
                        disabled={
                          !reviewRating || submitReviewMutation.isPending
                        }
                      >
                        {submitReviewMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Review"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold">
              {t("product.relatedProducts")}
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts
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

      {/* Login Dialog */}
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        onSuccess={handleLoginSuccess}
        message="Please sign in to add items to your cart"
      />
    </StoreLayout>
  );
}
