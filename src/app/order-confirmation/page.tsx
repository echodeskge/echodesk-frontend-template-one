"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { useLanguage } from "@/contexts/language-context";
import { useOrder } from "@/hooks/use-orders";
import { formatPrice } from "@/lib/store-config";
import { useStorefrontTemplate } from "@/hooks/use-storefront-template";
import { VoltageOrderConfirmationPage } from "@/templates/voltage/pages/order-confirmation";
import {
  CheckCircle,
  ShoppingBag,
  MapPin,
  CreditCard,
  Truck,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { Suspense } from "react";

function OrderConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const config = useStoreConfig();
  const { t, getLocalizedValue } = useLanguage();
  const { template } = useStorefrontTemplate();

  const { data: order, isLoading, isError } = useOrder(orderId);

  // Redirect if no order_id
  useEffect(() => {
    if (!orderId) {
      router.push("/");
    }
  }, [orderId, router]);

  // Redirect on error
  useEffect(() => {
    if (isError && !isLoading) {
      router.push("/");
    }
  }, [isError, isLoading, router]);

  if (!orderId) {
    return null;
  }

  // Voltage tenants get the bold receipt page. Classic continues with
  // this page's body. All hooks above already ran.
  if (template === "voltage") {
    return (
      <StoreLayout>
        <VoltageOrderConfirmationPage />
      </StoreLayout>
    );
  }

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="container py-12">
          <div className="mx-auto max-w-2xl space-y-6">
            <Skeleton className="h-12 w-48 mx-auto" />
            <Skeleton className="h-6 w-64 mx-auto" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!order) {
    return null;
  }

  const orderStatusRaw = order.status ? String(order.status) : "";
  const statusKeys: Record<string, string> = {
    pending: "orders.statusPending",
    confirmed: "orders.confirmed",
    shipped: "orders.shipped",
    delivered: "orders.delivered",
    cancelled: "orders.cancelled",
    refunded: "orders.refunded",
    processing: "orders.processing",
  };
  const orderStatus = (() => {
    const key = statusKeys[orderStatusRaw.toLowerCase()];
    if (key) {
      const translated = t(key);
      if (translated && translated !== key) return translated;
    }
    return orderStatusRaw.charAt(0).toUpperCase() + orderStatusRaw.slice(1);
  })();

  const statusColor = (() => {
    switch (orderStatusRaw) {
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  })();

  return (
    <StoreLayout>
      <div className="container py-12">
        <div className="mx-auto max-w-2xl">
          {/* Success Header */}
          <div className="text-center mb-8">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-3xl font-bold">
              {t("orderConfirmation.thankYou") || "Thank You!"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t("orderConfirmation.orderPlaced") ||
                "Your order has been placed successfully."}
            </p>
            <div className="mt-4 inline-flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t("orders.orderNumber") || "Order"}:
              </span>
              <span className="font-mono font-bold text-lg">
                #{order.order_number}
              </span>
              {orderStatusRaw && (
                <Badge className={statusColor}>{orderStatus}</Badge>
              )}
            </div>
          </div>

          {/* Order Items */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingBag className="h-5 w-5" />
                {t("orders.orderItems") || "Order Items"} ({order.total_items})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">
                      {getLocalizedValue(item.product_name)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("product.quantity") || "Qty"}: {item.quantity} x{" "}
                      {formatPrice(
                        parseFloat(item.price),
                        config.locale.currency,
                        config.locale.locale
                      )}
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
              ))}

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                {order.subtotal && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("cart.subtotal") || "Subtotal"}
                    </span>
                    <span>
                      {formatPrice(
                        parseFloat(order.subtotal),
                        config.locale.currency,
                        config.locale.locale
                      )}
                    </span>
                  </div>
                )}
                {order.shipping_cost && parseFloat(order.shipping_cost) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("cart.shipping") || "Shipping"}
                    </span>
                    <span>
                      {formatPrice(
                        parseFloat(order.shipping_cost),
                        config.locale.currency,
                        config.locale.locale
                      )}
                    </span>
                  </div>
                )}
                {order.tax_amount && parseFloat(order.tax_amount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("cart.tax") || "Tax"}
                    </span>
                    <span>
                      {formatPrice(
                        parseFloat(order.tax_amount),
                        config.locale.currency,
                        config.locale.locale
                      )}
                    </span>
                  </div>
                )}
                {order.discount_amount &&
                  parseFloat(order.discount_amount) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>{t("checkout.discount") || "Discount"}</span>
                      <span>
                        -
                        {formatPrice(
                          parseFloat(order.discount_amount),
                          config.locale.currency,
                          config.locale.locale
                        )}
                      </span>
                    </div>
                  )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>{t("cart.total") || "Total"}</span>
                  <span>
                    {formatPrice(
                      parseFloat(order.total_amount),
                      config.locale.currency,
                      config.locale.locale
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery & Payment Info */}
          <div className="grid gap-6 sm:grid-cols-2 mb-8">
            {/* Delivery Address */}
            {order.delivery_address && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4" />
                    {t("orders.deliveryAddress") || "Delivery Address"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {order.delivery_address.label}
                  </p>
                  <p>{order.delivery_address.address}</p>
                  <p>{order.delivery_address.city}</p>
                  {order.delivery_address.extra_instructions && (
                    <p className="mt-1 text-xs italic">
                      {order.delivery_address.extra_instructions}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Method */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <CreditCard className="h-4 w-4" />
                  {t("checkout.paymentInfo") || "Payment Method"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {order.payment_method === "cash_on_delivery"
                    ? "Cash on Delivery"
                    : t("home.securePayment") || "Card Payment"}
                </p>
                {order.payment_status && (
                  <p className="mt-1">
                    Status:{" "}
                    <span className="capitalize">{String(order.payment_status)}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Shipping Method */}
          {order.shipping_method_details && (
            <Card className="mb-8">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Truck className="h-4 w-4" />
                  {t("checkout.shippingMethod") || "Shipping Method"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {getLocalizedValue(order.shipping_method_details.name)}
                </p>
                {order.estimated_delivery_date && (
                  <p>
                    {t("orderConfirmation.estimatedDelivery") ||
                      "Estimated delivery"}
                    : {new Date(order.estimated_delivery_date).toLocaleDateString()}
                  </p>
                )}
                {order.tracking_number && (
                  <p>
                    {t("orderConfirmation.trackingNumber") || "Tracking"}:{" "}
                    {order.tracking_number}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Courier card — rendered when no static shipping_method is set
               but Quickshipper booked a courier (tenant has Quickshipper on).
               Same fields as the static-method block, plus the courier name. */}
          {!order.shipping_method_details &&
            (order.courier_provider || order.tracking_number) && (
              <Card className="mb-8">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Truck className="h-4 w-4" />
                    {t("orderConfirmation.courier") || "Courier"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  {order.courier_provider && (
                    <p className="font-medium text-foreground capitalize">
                      {order.courier_provider}
                    </p>
                  )}
                  {order.tracking_number && (
                    <p>
                      {t("orderConfirmation.trackingNumber") || "Tracking"}:{" "}
                      <span className="font-mono">{order.tracking_number}</span>
                    </p>
                  )}
                  {order.estimated_delivery_date && (
                    <p>
                      {t("orderConfirmation.estimatedDelivery") ||
                        "Estimated delivery"}
                      :{" "}
                      {new Date(order.estimated_delivery_date).toLocaleDateString()}
                    </p>
                  )}
                  {!order.tracking_number && (
                    <p>
                      {t("orderConfirmation.courierBooking") ||
                        "We're handing your order to the courier — tracking will appear here within a few minutes."}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Notes */}
          {order.notes && (
            <Card className="mb-8">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <ClipboardList className="h-4 w-4" />
                  {t("orders.notes") || "Notes"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="flex-1" size="lg">
              <Link href="/">
                <ShoppingBag className="mr-2 h-4 w-4" />
                {t("cart.continueShopping") || "Continue Shopping"}
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1" size="lg">
              <Link href="/account/orders">
                <ClipboardList className="mr-2 h-4 w-4" />
                {t("common.myOrders") || "View My Orders"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <StoreLayout>
          <div className="container py-12">
            <div className="mx-auto max-w-2xl space-y-6">
              <Skeleton className="h-12 w-48 mx-auto" />
              <Skeleton className="h-6 w-64 mx-auto" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </StoreLayout>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
