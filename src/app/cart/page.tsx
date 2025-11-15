"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import {
  useCart,
  useCartItems,
  useUpdateCartItem,
  useRemoveFromCart,
} from "@/hooks/use-cart";
import { formatPrice } from "@/lib/store-config";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function CartPage() {
  const config = useStoreConfig();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { t, getLocalizedValue } = useLanguage();
  const [promoCode, setPromoCode] = useState("");

  const { data: cart, isLoading: isCartLoading } = useCart();
  const { data: cartItemsData, isLoading: isItemsLoading } = useCartItems();
  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      // Remove item if quantity becomes 0
      removeFromCart.mutate(String(itemId));
    } else {
      updateCartItem.mutate({
        id: String(itemId),
        data: { quantity: newQuantity },
      });
    }
  };

  const handleRemoveItem = (itemId: number) => {
    removeFromCart.mutate(String(itemId));
  };

  // Calculate totals from cart data
  const subtotal = cart?.total_amount ? parseFloat(cart.total_amount) : 0;
  const shipping = subtotal > 50 ? 0 : 10;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  const isLoading = isAuthLoading || isCartLoading || isItemsLoading;
  const cartItems = cartItemsData?.results || [];

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="container py-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="mt-2 h-6 w-32" />
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Skeleton className="h-64" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <StoreLayout>
        <div className="container py-16">
          <div className="mx-auto max-w-md text-center">
            <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
            <h1 className="mt-6 text-2xl font-bold">
              {t("auth.login")} {t("common.cart")}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t("cart.loginRequired") || "Please login to view your cart"}
            </p>
            <Button asChild className="mt-6">
              <Link href="/login">{t("common.signIn")}</Link>
            </Button>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <StoreLayout>
        <div className="container py-16">
          <div className="mx-auto max-w-md text-center">
            <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
            <h1 className="mt-6 text-2xl font-bold">{t("cart.empty")}</h1>
            <p className="mt-2 text-muted-foreground">
              {t("cart.emptyDesc") ||
                "Looks like you haven't added any items to your cart yet."}
            </p>
            <Button asChild className="mt-6">
              <Link href="/products">{t("cart.continueShopping")}</Link>
            </Button>
          </div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold">{t("cart.title")}</h1>
        <p className="mt-2 text-muted-foreground">
          {cartItems.length}{" "}
          {cartItems.length === 1
            ? t("orders.item") || "item"
            : t("orders.items") || "items"}{" "}
          {t("cart.inYourCart") || "in your cart"}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {cartItems.map((item, index) => (
                    <div key={item.id}>
                      {index > 0 && <Separator className="mb-6" />}
                      <div className="flex gap-4">
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border">
                          <Image
                            src={typeof item.product === 'object' ? (item.product as any).image || "/placeholder.svg" : "/placeholder.svg"}
                            alt={
                              typeof item.product === 'object'
                                ? getLocalizedValue((item.product as any).name)
                                : "Product"
                            }
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <Link
                              href={`/products/${typeof item.product === 'object' ? (item.product as any).slug : item.product}`}
                              className="font-medium hover:text-primary"
                            >
                              {typeof item.product === 'object'
                                ? getLocalizedValue((item.product as any).name)
                                : "Product"}
                            </Link>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.id,
                                    (item.quantity || 1) - 1
                                  )
                                }
                                disabled={
                                  updateCartItem.isPending ||
                                  removeFromCart.isPending
                                }
                              >
                                {updateCartItem.isPending ||
                                removeFromCart.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Minus className="h-3 w-3" />
                                )}
                              </Button>
                              <span className="w-8 text-center text-sm">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.id,
                                    (item.quantity || 1) + 1
                                  )
                                }
                                disabled={updateCartItem.isPending}
                              >
                                {updateCartItem.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Plus className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={removeFromCart.isPending}
                            >
                              {removeFromCart.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatPrice(
                              parseFloat(item.subtotal),
                              config.locale.currency,
                              config.locale.locale
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(
                              parseFloat(item.price_at_add),
                              config.locale.currency,
                              config.locale.locale
                            )}{" "}
                            {t("cart.each") || "each"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Continue Shopping */}
            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link href="/products">{t("cart.continueShopping")}</Link>
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("checkout.orderSummary") || "Order Summary"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>{t("cart.subtotal")}</span>
                  <span>
                    {formatPrice(
                      subtotal,
                      config.locale.currency,
                      config.locale.locale
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t("cart.shipping")}</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-600">
                        {t("home.freeShipping") || "Free"}
                      </span>
                    ) : (
                      formatPrice(
                        shipping,
                        config.locale.currency,
                        config.locale.locale
                      )
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t("cart.tax")} (18%)</span>
                  <span>
                    {formatPrice(
                      tax,
                      config.locale.currency,
                      config.locale.locale
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>{t("cart.total")}</span>
                  <span>
                    {formatPrice(
                      total,
                      config.locale.currency,
                      config.locale.locale
                    )}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                {/* Promo Code */}
                <div className="flex w-full gap-2">
                  <Input
                    placeholder={t("cart.promoCode") || "Promo code"}
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <Button variant="outline">
                    {t("cart.apply") || "Apply"}
                  </Button>
                </div>

                <Button asChild className="w-full" size="lg">
                  <Link href="/checkout">
                    {t("cart.checkout")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  {t("cart.secureCheckout") ||
                    "Secure checkout powered by Echodesk"}
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
