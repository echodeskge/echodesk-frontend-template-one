"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { StoreLayout } from "@/components/layout/store-layout";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { formatPrice } from "@/lib/store-config";
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
} from "lucide-react";

// Placeholder product data - will be fetched from API
const productData = {
  id: "1",
  slug: "premium-wireless-headphones",
  name: "Premium Wireless Headphones",
  shortDescription: "High-quality wireless headphones with active noise cancellation",
  description: `
    Experience crystal-clear audio with our Premium Wireless Headphones.
    Featuring advanced active noise cancellation technology, these headphones
    deliver immersive sound quality whether you're commuting, working, or relaxing.

    With up to 30 hours of battery life and quick charging capabilities,
    you'll never miss a beat. The ergonomic design ensures comfort during
    extended listening sessions, while the premium materials provide durability
    that lasts.
  `,
  images: ["/placeholder.jpg", "/placeholder.jpg", "/placeholder.jpg"],
  price: 99.99,
  compareAtPrice: 129.99,
  sku: "WH-001",
  quantity: 50,
  isOnSale: true,
  isFeatured: true,
  isNew: false,
  attributes: [
    { name: "Color", value: "Black" },
    { name: "Connectivity", value: "Bluetooth 5.0" },
    { name: "Battery Life", value: "30 hours" },
    { name: "Weight", value: "250g" },
  ],
};

const relatedProducts = [
  {
    id: "2",
    slug: "product-2",
    name: "Smart Watch Pro",
    image: "/placeholder.jpg",
    price: 249.99,
    isFeatured: true,
    isNew: true,
  },
  {
    id: "3",
    slug: "product-3",
    name: "Portable Bluetooth Speaker",
    image: "/placeholder.jpg",
    price: 79.99,
    compareAtPrice: 99.99,
  },
  {
    id: "4",
    slug: "product-4",
    name: "USB-C Hub Adapter",
    image: "/placeholder.jpg",
    price: 49.99,
  },
  {
    id: "5",
    slug: "product-5",
    name: "Ergonomic Mouse",
    image: "/placeholder.jpg",
    price: 69.99,
    compareAtPrice: 89.99,
    isOnSale: true,
  },
];

export default function ProductDetailPage() {
  const params = useParams();
  const config = useStoreConfig();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const product = productData; // In real app, fetch based on params.slug

  const discountPercentage =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) *
            100
        )
      : 0;

  return (
    <StoreLayout>
      <div className="container py-8">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-muted-foreground">
          <a href="/" className="hover:text-primary">
            Home
          </a>
          <span className="mx-2">/</span>
          <a href="/products" className="hover:text-primary">
            Products
          </a>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        {/* Product Details */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg border">
              <Image
                src={product.images[selectedImage] || "/placeholder.jpg"}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              {discountPercentage > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute left-4 top-4 text-sm"
                >
                  -{discountPercentage}%
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {product.images.map((image, index) => (
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
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2">
                {product.isNew && <Badge className="bg-blue-500">New</Badge>}
                {product.isFeatured && (
                  <Badge className="bg-amber-500">Featured</Badge>
                )}
              </div>
              <h1 className="mt-2 text-3xl font-bold">{product.name}</h1>
              <p className="mt-2 text-muted-foreground">
                SKU: {product.sku}
              </p>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">
                {formatPrice(
                  product.price,
                  config.locale.currency,
                  config.locale.locale
                )}
              </span>
              {product.compareAtPrice &&
                product.compareAtPrice > product.price && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(
                      product.compareAtPrice,
                      config.locale.currency,
                      config.locale.locale
                    )}
                  </span>
                )}
            </div>

            <p className="text-muted-foreground">{product.shortDescription}</p>

            <Separator />

            {/* Quantity Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quantity</Label>
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
                    setQuantity(Math.min(product.quantity, quantity + 1))
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {product.quantity} in stock
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button size="lg" className="flex-1">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
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
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <RotateCcw className="h-5 w-5 text-primary" />
                <span>30-Day Returns</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-5 w-5 text-primary" />
                <span>2-Year Warranty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              {config.features.reviews && (
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="description" className="mt-4">
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">{product.description}</p>
              </div>
            </TabsContent>
            <TabsContent value="specifications" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {product.attributes.map((attr) => (
                  <div
                    key={attr.name}
                    className="flex justify-between rounded-lg bg-muted/50 p-4"
                  >
                    <span className="font-medium">{attr.name}</span>
                    <span className="text-muted-foreground">{attr.value}</span>
                  </div>
                ))}
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
        <section className="mt-16">
          <h2 className="text-2xl font-bold">Related Products</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </section>
      </div>
    </StoreLayout>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
