"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useCart, useCartItems } from "@/hooks/use-cart";
import { useAddresses, useCreateAddress } from "@/hooks/use-addresses";
import { useCreateOrder } from "@/hooks/use-orders";
import { formatPrice } from "@/lib/store-config";
import { toast } from "sonner";
import {
  ecommerceClientCardsRetrieve,
} from "@/api/generated/api";
import axiosInstance from "@/api/axios";
import type { ClientAddressRequest } from "@/api/generated/interfaces";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  Truck,
  Lock,
  Loader2,
  Plus,
  MapPin,
  ChevronLeft,
  Check,
  ShoppingBag,
  ClipboardList,
} from "lucide-react";

interface SavedCard {
  id: number;
  masked_pan: string;
  expiry_date?: string;
  card_brand?: string;
  is_default?: boolean;
}

export default function CheckoutPage() {
  const config = useStoreConfig();
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { t, getLocalizedValue } = useLanguage();

  const [step, setStep] = useState(1);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [orderNotes, setOrderNotes] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<ClientAddressRequest>({
    label: "",
    address: "",
    city: "",
    extra_instructions: "",
    is_default: false,
  });

  // Data fetching
  const { data: cart, isLoading: isCartLoading } = useCart();
  const { data: cartItemsData, isLoading: isItemsLoading } = useCartItems();
  const { data: addressesData, isLoading: isAddressesLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const createOrder = useCreateOrder();

  // Fetch theme/payment config
  const { data: themeData } = useQuery({
    queryKey: ["theme"],
    queryFn: () => axiosInstance.get("/api/ecommerce/client/theme/").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch saved cards
  const { data: cardsData, isLoading: isCardsLoading } = useQuery({
    queryKey: ["cards"],
    queryFn: () => ecommerceClientCardsRetrieve(),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });

  const paymentConfig = themeData?.payment;
  const showCardPayment = paymentConfig?.enable_card_payment ?? true;
  const showCashOnDelivery = paymentConfig?.enable_cash_on_delivery ?? false;

  const cartItems = cartItemsData?.results || [];
  const addresses = addressesData?.results || [];
  const savedCards: SavedCard[] = cardsData?.results || cardsData || [];

  // Calculate totals
  const subtotal = cart?.total_amount ? parseFloat(cart.total_amount) : 0;
  const total = subtotal;

  // Set default address and payment method
  useEffect(() => {
    if (addresses.length > 0 && selectedAddressId === null) {
      const defaultAddr = addresses.find((a) => a.is_default);
      setSelectedAddressId(defaultAddr?.id || addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    if (!paymentMethod) {
      if (showCardPayment) {
        setPaymentMethod("card");
      } else if (showCashOnDelivery) {
        setPaymentMethod("cash_on_delivery");
      }
    }
  }, [showCardPayment, showCashOnDelivery, paymentMethod]);

  useEffect(() => {
    if (paymentMethod === "card" && Array.isArray(savedCards) && savedCards.length > 0 && selectedCardId === null) {
      const defaultCard = savedCards.find((c) => c.is_default);
      setSelectedCardId(defaultCard?.id || savedCards[0]?.id || null);
    }
  }, [savedCards, paymentMethod, selectedCardId]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login?callbackUrl=/checkout");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!isCartLoading && !isItemsLoading && isAuthenticated && cartItems.length === 0) {
      router.push("/cart");
    }
  }, [isCartLoading, isItemsLoading, isAuthenticated, cartItems.length, router]);

  const handleCreateAddress = async () => {
    if (!newAddress.label || !newAddress.address || !newAddress.city) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const result = await createAddress.mutateAsync(newAddress);
      setSelectedAddressId((result as any).id);
      setShowAddressForm(false);
      setNewAddress({
        label: "",
        address: "",
        city: "",
        extra_instructions: "",
        is_default: false,
      });
    } catch {
      // Error is handled by the hook
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart || !selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    try {
      const orderData: any = {
        cart_id: cart.id,
        delivery_address_id: selectedAddressId,
        notes: orderNotes || undefined,
      };

      if (paymentMethod === "card" && selectedCardId) {
        orderData.card_id = selectedCardId;
      }

      const result = await createOrder.mutateAsync(orderData);

      // If payment URL returned (BOG redirect), redirect there
      if ((result as any).payment_url) {
        window.location.href = (result as any).payment_url;
        return;
      }

      // Cash on delivery or already processed - go to orders
      router.push("/account/orders");
    } catch {
      // Error is handled by the hook
    }
  };

  const getProductData = (product: any) => {
    if (typeof product === "object" && product !== null) {
      return product;
    }
    return null;
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // Loading state
  if (isAuthLoading || isCartLoading || isItemsLoading) {
    return (
      <StoreLayout>
        <div className="container py-8">
          <Skeleton className="h-10 w-48" />
          <div className="mt-8 flex items-center justify-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-px w-12" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-px w-12" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Skeleton className="h-96" />
            </div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </StoreLayout>
    );
  }

  // Not authenticated guard
  if (!isAuthenticated) {
    return null;
  }

  // Empty cart guard
  if (cartItems.length === 0) {
    return null;
  }

  return (
    <StoreLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-2">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/cart">
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t("cart.title")}
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{t("checkout.title")}</h1>
        </div>

        {/* Progress Steps */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step > 1
                  ? "bg-primary text-primary-foreground"
                  : step === 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
              }`}
            >
              {step > 1 ? <Check className="h-4 w-4" /> : 1}
            </div>
            <span className="hidden text-sm font-medium sm:inline">
              {t("checkout.shippingInfo") || "Shipping"}
            </span>
          </button>
          <div className={`h-px w-12 ${step >= 2 ? "bg-primary" : "bg-border"}`} />
          <button
            onClick={() => {
              if (selectedAddressId) setStep(2);
            }}
            className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step > 2
                  ? "bg-primary text-primary-foreground"
                  : step === 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
              }`}
            >
              {step > 2 ? <Check className="h-4 w-4" /> : 2}
            </div>
            <span className="hidden text-sm font-medium sm:inline">
              {t("checkout.paymentInfo") || "Payment"}
            </span>
          </button>
          <div className={`h-px w-12 ${step >= 3 ? "bg-primary" : "bg-border"}`} />
          <button
            onClick={() => {
              if (selectedAddressId && paymentMethod) setStep(3);
            }}
            className={`flex items-center gap-2 ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === 3
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              3
            </div>
            <span className="hidden text-sm font-medium sm:inline">
              {t("checkout.orderSummary") || "Review"}
            </span>
          </button>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    {t("checkout.shippingInfo") || "Shipping Address"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isAddressesLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20" />
                      <Skeleton className="h-20" />
                    </div>
                  ) : addresses.length > 0 ? (
                    <RadioGroup
                      value={selectedAddressId?.toString() || ""}
                      onValueChange={(val) => {
                        setSelectedAddressId(parseInt(val));
                        setShowAddressForm(false);
                      }}
                    >
                      <div className="space-y-3">
                        {addresses.map((address) => (
                          <div
                            key={address.id}
                            className={`flex items-start space-x-3 rounded-lg border p-4 transition-colors ${
                              selectedAddressId === address.id
                                ? "border-primary bg-primary/5"
                                : "hover:border-muted-foreground/30"
                            }`}
                          >
                            <RadioGroupItem
                              value={address.id.toString()}
                              id={`addr-${address.id}`}
                              className="mt-1"
                            />
                            <Label
                              htmlFor={`addr-${address.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{address.label}</span>
                                {address.is_default && (
                                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                    {t("addresses.default") || "Default"}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {address.address}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {address.city}
                              </p>
                              {address.extra_instructions && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {address.extra_instructions}
                                </p>
                              )}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  ) : (
                    !showAddressForm && (
                      <div className="py-8 text-center">
                        <MapPin className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                        <p className="mt-2 text-muted-foreground">
                          {t("addresses.noAddresses") || "No saved addresses"}
                        </p>
                        <Button
                          className="mt-4"
                          onClick={() => setShowAddressForm(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {t("addresses.addFirst") || "Add Your First Address"}
                        </Button>
                      </div>
                    )
                  )}

                  {/* Add New Address Button */}
                  {!showAddressForm && addresses.length > 0 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAddressForm(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("addresses.addAddress") || "Add New Address"}
                    </Button>
                  )}

                  {/* Add Address Form */}
                  {showAddressForm && (
                    <div className="space-y-4 rounded-lg border p-4">
                      <h3 className="font-medium">
                        {t("addresses.addAddress") || "Add New Address"}
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="label">
                          {t("addresses.label") || "Label"} *
                        </Label>
                        <Input
                          id="label"
                          placeholder={t("addresses.labelPlaceholder") || "e.g., Home, Office"}
                          value={newAddress.label}
                          onChange={(e) =>
                            setNewAddress((prev) => ({
                              ...prev,
                              label: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">
                          {t("checkout.address") || "Address"} *
                        </Label>
                        <Input
                          id="address"
                          placeholder={t("addresses.addressPlaceholder") || "Full street address"}
                          value={newAddress.address}
                          onChange={(e) =>
                            setNewAddress((prev) => ({
                              ...prev,
                              address: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">
                          {t("checkout.city") || "City"} *
                        </Label>
                        <Input
                          id="city"
                          placeholder={t("addresses.cityPlaceholder") || "City name"}
                          value={newAddress.city}
                          onChange={(e) =>
                            setNewAddress((prev) => ({
                              ...prev,
                              city: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="extra">
                          {t("addresses.extraInstructions") || "Extra Instructions"}
                        </Label>
                        <Textarea
                          id="extra"
                          placeholder={
                            t("addresses.extraInstructionsPlaceholder") ||
                            "Delivery instructions, landmarks, etc."
                          }
                          value={newAddress.extra_instructions || ""}
                          onChange={(e) =>
                            setNewAddress((prev) => ({
                              ...prev,
                              extra_instructions: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowAddressForm(false)}
                        >
                          {t("common.cancel") || "Cancel"}
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={handleCreateAddress}
                          disabled={createAddress.isPending}
                        >
                          {createAddress.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="mr-2 h-4 w-4" />
                          )}
                          {t("common.save") || "Save"}
                        </Button>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setStep(2)}
                    disabled={!selectedAddressId}
                  >
                    {t("checkout.paymentInfo") || "Continue to Payment"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {t("checkout.paymentInfo") || "Payment Method"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(val) => {
                      setPaymentMethod(val);
                      if (val !== "card") {
                        setSelectedCardId(null);
                      }
                    }}
                  >
                    {showCardPayment && (
                      <div
                        className={`rounded-lg border p-4 transition-colors ${
                          paymentMethod === "card"
                            ? "border-primary bg-primary/5"
                            : "hover:border-muted-foreground/30"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="card" id="card" />
                          <Label htmlFor="card" className="flex-1 cursor-pointer">
                            <div className="font-medium">
                              {t("home.securePayment") || "Card Payment"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {t("home.securePaymentDesc") || "Pay securely with your card"}
                            </div>
                          </Label>
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                        </div>

                        {/* Saved Cards */}
                        {paymentMethod === "card" && (
                          <div className="mt-4 space-y-3 pl-7">
                            {isCardsLoading ? (
                              <div className="space-y-2">
                                <Skeleton className="h-12" />
                                <Skeleton className="h-12" />
                              </div>
                            ) : Array.isArray(savedCards) && savedCards.length > 0 ? (
                              <RadioGroup
                                value={selectedCardId?.toString() || "new"}
                                onValueChange={(val) => {
                                  if (val === "new") {
                                    setSelectedCardId(null);
                                  } else {
                                    setSelectedCardId(parseInt(val));
                                  }
                                }}
                              >
                                {savedCards.map((card) => (
                                  <div
                                    key={card.id}
                                    className={`flex items-center space-x-3 rounded-md border p-3 transition-colors ${
                                      selectedCardId === card.id
                                        ? "border-primary bg-primary/5"
                                        : ""
                                    }`}
                                  >
                                    <RadioGroupItem
                                      value={card.id.toString()}
                                      id={`card-${card.id}`}
                                    />
                                    <Label
                                      htmlFor={`card-${card.id}`}
                                      className="flex flex-1 cursor-pointer items-center justify-between"
                                    >
                                      <div>
                                        <span className="font-medium">
                                          {card.card_brand || "Card"} **** {card.masked_pan?.slice(-4) || "****"}
                                        </span>
                                        {card.is_default && (
                                          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                            {t("cards.default") || "Default"}
                                          </span>
                                        )}
                                      </div>
                                      {card.expiry_date && (
                                        <span className="text-sm text-muted-foreground">
                                          {t("cards.expires") || "Expires"} {card.expiry_date}
                                        </span>
                                      )}
                                    </Label>
                                  </div>
                                ))}
                                <div
                                  className={`flex items-center space-x-3 rounded-md border p-3 transition-colors ${
                                    selectedCardId === null
                                      ? "border-primary bg-primary/5"
                                      : ""
                                  }`}
                                >
                                  <RadioGroupItem value="new" id="card-new" />
                                  <Label
                                    htmlFor="card-new"
                                    className="cursor-pointer font-medium"
                                  >
                                    {t("cards.addNew") || "Pay with new card"}
                                  </Label>
                                </div>
                              </RadioGroup>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {t("cards.noCards") ||
                                  "No saved cards. You will be redirected to the payment gateway."}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {showCashOnDelivery && (
                      <div
                        className={`rounded-lg border p-4 transition-colors ${
                          paymentMethod === "cash_on_delivery"
                            ? "border-primary bg-primary/5"
                            : "hover:border-muted-foreground/30"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="cash_on_delivery" id="cod" />
                          <Label htmlFor="cod" className="flex-1 cursor-pointer">
                            <div className="font-medium">Cash on Delivery</div>
                            <div className="text-sm text-muted-foreground">
                              Pay when you receive your order
                            </div>
                          </Label>
                          <Truck className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </RadioGroup>

                  {!showCardPayment && !showCashOnDelivery && (
                    <div className="py-8 text-center">
                      <CreditCard className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <p className="mt-2 text-muted-foreground">
                        No payment methods are currently available. Please try again later.
                      </p>
                    </div>
                  )}

                  {/* Order Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">{t("orders.notes") || "Order Notes"}</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any special instructions for your order..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(1)}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      {t("checkout.shippingInfo") || "Shipping"}
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => setStep(3)}
                      disabled={!paymentMethod}
                    >
                      {t("checkout.orderSummary") || "Review Order"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Review & Place Order */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    {t("checkout.orderSummary") || "Review Your Order"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Shipping Address */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-2 font-medium">
                        <MapPin className="h-4 w-4" />
                        {t("orders.deliveryAddress") || "Delivery Address"}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStep(1)}
                      >
                        {t("common.edit") || "Edit"}
                      </Button>
                    </div>
                    {selectedAddress && (
                      <div className="mt-2 rounded-md bg-muted/50 p-3">
                        <p className="font-medium">{selectedAddress.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedAddress.address}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedAddress.city}
                        </p>
                        {selectedAddress.extra_instructions && (
                          <p className="mt-1 text-xs text-muted-foreground italic">
                            {selectedAddress.extra_instructions}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Payment Method */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-2 font-medium">
                        <CreditCard className="h-4 w-4" />
                        {t("checkout.paymentInfo") || "Payment Method"}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStep(2)}
                      >
                        {t("common.edit") || "Edit"}
                      </Button>
                    </div>
                    <div className="mt-2 rounded-md bg-muted/50 p-3">
                      {paymentMethod === "card" ? (
                        <>
                          {selectedCardId ? (
                            <p className="text-sm">
                              {(() => {
                                const card = Array.isArray(savedCards)
                                  ? savedCards.find((c) => c.id === selectedCardId)
                                  : null;
                                return card
                                  ? `${card.card_brand || "Card"} **** ${card.masked_pan?.slice(-4) || "****"}`
                                  : "Card Payment";
                              })()}
                            </p>
                          ) : (
                            <p className="text-sm">
                              {t("home.securePayment") || "Card Payment"} - You will be redirected to the payment gateway
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm">Cash on Delivery</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Order Items */}
                  <div>
                    <h3 className="flex items-center gap-2 font-medium">
                      <ShoppingBag className="h-4 w-4" />
                      {t("orders.orderItems") || "Order Items"} ({cartItems.length})
                    </h3>
                    <div className="mt-3 space-y-3">
                      {cartItems.map((item) => {
                        const productData = getProductData(item.product);
                        return (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border">
                              <Image
                                src={productData?.image || "/placeholder.svg"}
                                alt={
                                  productData
                                    ? getLocalizedValue(productData.name)
                                    : "Product"
                                }
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-medium">
                                {productData
                                  ? getLocalizedValue(productData.name)
                                  : "Product"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t("product.quantity") || "Qty"}: {item.quantity || 1}
                              </p>
                            </div>
                            <p className="text-sm font-medium">
                              {formatPrice(
                                parseFloat(item.subtotal),
                                config.locale.currency,
                                config.locale.locale
                              )}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Notes */}
                  {orderNotes && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-medium">{t("orders.notes") || "Notes"}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {orderNotes}
                        </p>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(2)}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      {t("checkout.paymentInfo") || "Payment"}
                    </Button>
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={handlePlaceOrder}
                      disabled={createOrder.isPending}
                    >
                      {createOrder.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Lock className="mr-2 h-4 w-4" />
                      )}
                      {createOrder.isPending
                        ? t("common.loading") || "Processing..."
                        : t("checkout.placeOrder") || "Place Order"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("checkout.orderSummary") || "Order Summary"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items Summary */}
                <div className="max-h-64 space-y-3 overflow-y-auto">
                  {cartItems.map((item) => {
                    const productData = getProductData(item.product);
                    return (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border">
                          <Image
                            src={productData?.image || "/placeholder.svg"}
                            alt={
                              productData
                                ? getLocalizedValue(productData.name)
                                : "Product"
                            }
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm">
                            {productData
                              ? getLocalizedValue(productData.name)
                              : "Product"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            x{item.quantity || 1}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          {formatPrice(
                            parseFloat(item.subtotal),
                            config.locale.currency,
                            config.locale.locale
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("cart.subtotal")}
                  </span>
                  <span>
                    {formatPrice(
                      subtotal,
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

                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  {t("cart.secureCheckout") || "Secure checkout powered by Echodesk"}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
