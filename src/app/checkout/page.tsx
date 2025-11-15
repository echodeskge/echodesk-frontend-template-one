"use client";

import { useState } from "react";
import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { formatPrice } from "@/lib/store-config";
import { CreditCard, Truck, Lock } from "lucide-react";

export default function CheckoutPage() {
  const config = useStoreConfig();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("card");

  // Placeholder order summary
  const subtotal = 279.97;
  const shipping = 0;
  const tax = 50.39;
  const total = 330.36;

  return (
    <StoreLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold">Checkout</h1>

        {/* Progress Steps */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <div
            className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              1
            </div>
            <span className="hidden sm:inline">Shipping</span>
          </div>
          <div className="h-px w-12 bg-border" />
          <div
            className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              2
            </div>
            <span className="hidden sm:inline">Payment</span>
          </div>
          <div className="h-px w-12 bg-border" />
          <div
            className={`flex items-center gap-2 ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              3
            </div>
            <span className="hidden sm:inline">Review</span>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" placeholder="+995 555 123 456" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" placeholder="123 Main Street" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" placeholder="Tbilisi" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Region</Label>
                      <Input id="state" placeholder="Tbilisi" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input id="zip" placeholder="0100" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="saveAddress" />
                    <label
                      htmlFor="saveAddress"
                      className="text-sm font-medium"
                    >
                      Save this address for future orders
                    </label>
                  </div>
                  <Button className="w-full" onClick={() => setStep(2)}>
                    Continue to Payment
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <div className="flex items-center space-x-2 rounded-lg border p-4">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer">
                        <div className="font-medium">Credit/Debit Card</div>
                        <div className="text-sm text-muted-foreground">
                          Pay securely with your card
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border p-4">
                      <RadioGroupItem value="bog" id="bog" />
                      <Label htmlFor="bog" className="flex-1 cursor-pointer">
                        <div className="font-medium">Bank of Georgia</div>
                        <div className="text-sm text-muted-foreground">
                          Pay with BOG payment gateway
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === "card" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          placeholder="4111 1111 1111 1111"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input id="expiry" placeholder="MM/YY" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input id="cvv" placeholder="123" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardName">Name on Card</Label>
                        <Input id="cardName" placeholder="JOHN DOE" />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(1)}
                    >
                      Back
                    </Button>
                    <Button className="flex-1" onClick={() => setStep(3)}>
                      Review Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium">Shipping Address</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      John Doe
                      <br />
                      123 Main Street
                      <br />
                      Tbilisi, 0100
                      <br />
                      +995 555 123 456
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-medium">Payment Method</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {paymentMethod === "card"
                        ? "Credit/Debit Card ending in 1111"
                        : "Bank of Georgia Payment Gateway"}
                    </p>
                  </div>
                  <Separator />
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" />
                    <label htmlFor="terms" className="text-sm">
                      I agree to the Terms of Service and Privacy Policy
                    </label>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(2)}
                    >
                      Back
                    </Button>
                    <Button className="flex-1">
                      <Lock className="mr-2 h-4 w-4" />
                      Place Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Premium Wireless Headphones × 2</span>
                  <span>
                    {formatPrice(
                      199.98,
                      config.locale.currency,
                      config.locale.locale
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Portable Bluetooth Speaker × 1</span>
                  <span>
                    {formatPrice(
                      79.99,
                      config.locale.currency,
                      config.locale.locale
                    )}
                  </span>
                </div>
                <Separator />
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
                  <span className="text-green-600">Free</span>
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
            </Card>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
