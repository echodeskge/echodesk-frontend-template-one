"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useOrders, useOrder } from "@/hooks/use-orders";
import { formatPrice } from "@/lib/store-config";
import {
  Package,
  ChevronLeft,
  Eye,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
} from "lucide-react";
import type { Order } from "@/api/generated/interfaces";

export default function OrdersPage() {
  const config = useStoreConfig();
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { t, getLocalizedValue } = useLanguage();

  const [currentPage, setCurrentPage] = useState(1);
  const [ordering, setOrdering] = useState("-created_at");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: ordersData, isLoading: isOrdersLoading } = useOrders(
    currentPage,
    ordering
  );
  const { data: selectedOrder, isLoading: isOrderLoading } =
    useOrder(selectedOrderId);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-green-500";
      case "processing":
        return "bg-blue-500";
      case "pending":
        return "bg-yellow-500";
      case "shipped":
        return "bg-amber-500";
      case "cancelled":
        return "bg-red-500";
      case "confirmed":
        return "bg-indigo-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "processing":
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      case "refunded":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(config.locale.locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isAuthLoading) {
    return (
      <StoreLayout>
        <div className="container py-8">
          <Skeleton className="mb-8 h-10 w-48" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <StoreLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/account">
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t("common.myAccount")}
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{t("common.myOrders")}</h1>
              <p className="mt-1 text-muted-foreground">
                {ordersData?.count || 0} {t("orders.totalOrders") || "total orders"}
              </p>
            </div>
            <Select value={ordering} onValueChange={setOrdering}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("productsPage.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-created_at">
                  {t("orders.newestFirst") || "Newest First"}
                </SelectItem>
                <SelectItem value="created_at">
                  {t("orders.oldestFirst") || "Oldest First"}
                </SelectItem>
                <SelectItem value="-total_amount">
                  {t("orders.highestAmount") || "Highest Amount"}
                </SelectItem>
                <SelectItem value="total_amount">
                  {t("orders.lowestAmount") || "Lowest Amount"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders List */}
        {isOrdersLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : !ordersData?.results?.length ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">
                {t("orders.noOrders") || "No orders yet"}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {t("orders.noOrdersDesc") ||
                  "When you place orders, they will appear here"}
              </p>
              <Button asChild className="mt-6">
                <Link href="/products">{t("cart.continueShopping")}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {ordersData.results.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 pb-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {t("orders.orderNumber") || "Order"} #{order.order_number}
                      </CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(order.created_at)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(order.status as any)}>
                        {getStatusIcon(order.status as any)}
                        <span className="ml-1">
                          {String(order.status || "pending")
                            .charAt(0)
                            .toUpperCase() +
                            String(order.status || "pending").slice(1)}
                        </span>
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getPaymentStatusColor(
                          order.payment_status as any
                        )}
                      >
                        <CreditCard className="mr-1 h-3 w-3" />
                        {String(order.payment_status || "pending")
                          .charAt(0)
                          .toUpperCase() +
                          String(order.payment_status || "pending").slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {order.total_items}{" "}
                        {order.total_items === 1
                          ? t("orders.item") || "item"
                          : t("orders.items") || "items"}
                      </p>
                      <p className="text-2xl font-bold">
                        {formatPrice(
                          parseFloat(order.total_amount),
                          config.locale.currency,
                          config.locale.locale
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedOrderId(String(order.id))}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        {t("orders.viewDetails") || "View Details"}
                      </Button>
                      {order.payment_url &&
                        order.payment_status?.toString().toLowerCase() ===
                          "pending" && (
                          <Button asChild>
                            <a
                              href={order.payment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              {t("orders.payNow") || "Pay Now"}
                            </a>
                          </Button>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {ordersData.count > 10 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={!ordersData.previous}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  {t("productsPage.previous")}
                </Button>
                <span className="flex items-center px-4">
                  {t("productsPage.page")} {currentPage} {t("productsPage.of")}{" "}
                  {Math.ceil(ordersData.count / 10)}
                </span>
                <Button
                  variant="outline"
                  disabled={!ordersData.next}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  {t("productsPage.next")}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog
        open={!!selectedOrderId}
        onOpenChange={(open) => !open && setSelectedOrderId(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {isOrderLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-32" />
              <Skeleton className="h-48" />
            </div>
          ) : selectedOrder ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {t("orders.orderNumber") || "Order"} #
                  {selectedOrder.order_number}
                </DialogTitle>
                <DialogDescription>
                  {t("orders.placedOn") || "Placed on"}{" "}
                  {formatDate(selectedOrder.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center gap-4">
                  <Badge
                    className={getStatusColor(selectedOrder.status as any)}
                  >
                    {getStatusIcon(selectedOrder.status as any)}
                    <span className="ml-1">
                      {String(selectedOrder.status || "pending")
                        .charAt(0)
                        .toUpperCase() +
                        String(selectedOrder.status || "pending").slice(1)}
                    </span>
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getPaymentStatusColor(
                      selectedOrder.payment_status as any
                    )}
                  >
                    <CreditCard className="mr-1 h-3 w-3" />
                    {String(selectedOrder.payment_status || "pending")
                      .charAt(0)
                      .toUpperCase() +
                      String(selectedOrder.payment_status || "pending").slice(
                        1
                      )}
                  </Badge>
                </div>

                <Separator />

                {/* Delivery Address */}
                {selectedOrder.delivery_address && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 font-semibold">
                      <MapPin className="h-4 w-4" />
                      {t("orders.deliveryAddress") || "Delivery Address"}
                    </h4>
                    <div className="rounded-lg bg-muted/50 p-4 text-sm">
                      <p className="font-medium">
                        {selectedOrder.delivery_address.label}
                      </p>
                      <p>{selectedOrder.delivery_address.address}</p>
                      <p>{selectedOrder.delivery_address.city}</p>
                      {selectedOrder.delivery_address.extra_instructions && (
                        <p className="mt-2 text-muted-foreground">
                          {selectedOrder.delivery_address.extra_instructions}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Order Items */}
                <div>
                  <h4 className="mb-4 font-semibold">
                    {t("orders.orderItems") || "Order Items"} (
                    {selectedOrder.total_items})
                  </h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">
                            {typeof item.product_name === "object"
                              ? getLocalizedValue(item.product_name)
                              : item.product_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t("product.quantity")}: {item.quantity} x{" "}
                            {formatPrice(
                              parseFloat(item.price),
                              config.locale.currency,
                              config.locale.locale
                            )}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {formatPrice(
                            parseFloat(item.subtotal),
                            config.locale.currency,
                            config.locale.locale
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Total */}
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>{t("cart.total")}</span>
                  <span>
                    {formatPrice(
                      parseFloat(selectedOrder.total_amount),
                      config.locale.currency,
                      config.locale.locale
                    )}
                  </span>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="mb-2 font-semibold">
                        {t("orders.notes") || "Notes"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.notes}
                      </p>
                    </div>
                  </>
                )}

                {/* Payment URL for pending orders */}
                {selectedOrder.payment_url &&
                  selectedOrder.payment_status?.toString().toLowerCase() ===
                    "pending" && (
                    <Button asChild className="w-full">
                      <a
                        href={selectedOrder.payment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        {t("orders.completePayment") || "Complete Payment"}
                      </a>
                    </Button>
                  )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </StoreLayout>
  );
}
