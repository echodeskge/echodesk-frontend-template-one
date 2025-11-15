"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { formatPrice } from "@/lib/store-config";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

// Placeholder cart items - will be managed by state/API
const initialCartItems = [
  {
    id: "1",
    productId: "1",
    name: "Premium Wireless Headphones",
    image: "/placeholder.jpg",
    price: 99.99,
    quantity: 2,
    sku: "WH-001",
  },
  {
    id: "2",
    productId: "3",
    name: "Portable Bluetooth Speaker",
    image: "/placeholder.jpg",
    price: 79.99,
    quantity: 1,
    sku: "BS-003",
  },
];

export default function CartPage() {
  const config = useStoreConfig();
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [promoCode, setPromoCode] = useState("");

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartItems((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    setCartItems((items) => items.filter((item) => item.id !== itemId));
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = subtotal > 50 ? 0 : 10; // Free shipping over 50
  const tax = subtotal * 0.18; // 18% tax
  const total = subtotal + shipping + tax;

  if (cartItems.length === 0) {
    return (
      <StoreLayout>
        <div className="container py-16">
          <div className="mx-auto max-w-md text-center">
            <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
            <h1 className="mt-6 text-2xl font-bold">Your cart is empty</h1>
            <p className="mt-2 text-muted-foreground">
              Looks like you haven&apos;t added any items to your cart yet.
            </p>
            <Button asChild className="mt-6">
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <p className="mt-2 text-muted-foreground">
          {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in your
          cart
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
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <Link
                              href={`/products/${item.productId}`}
                              className="font-medium hover:text-primary"
                            >
                              {item.name}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              SKU: {item.sku}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatPrice(
                              item.price * item.quantity,
                              config.locale.currency,
                              config.locale.locale
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(
                              item.price,
                              config.locale.currency,
                              config.locale.locale
                            )}{" "}
                            each
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
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    {formatPrice(
                      subtotal,
                      config.locale.currency,
                      config.locale.locale
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-600">Free</span>
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
                  <span>Tax (18%)</span>
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
                  <span>Total</span>
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
                    placeholder="Promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <Button variant="outline">Apply</Button>
                </div>

                <Button asChild className="w-full" size="lg">
                  <Link href="/checkout">
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Secure checkout powered by Echodesk
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
