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
import { useStorefrontTemplate } from "@/hooks/use-storefront-template";
import { VoltageAccountPage } from "@/templates/voltage/pages/account";
import { useOrders, useOrder } from "@/hooks/use-orders";
import { formatPrice } from "@/lib/store-config";
import { cn } from "@/lib/utils";
import axiosInstance from "@/api/axios";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/breadcrumbs";
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
  Loader2,
} from "lucide-react";
import type { Order } from "@/api/generated/interfaces";
import { ecommerceClientOrdersCancelCreate } from "@/api/generated/api";

function TimelineItem({
  label,
  date,
  active,
  isLast,
  formatDateFn,
}: {
  label: string;
  date: string;
  active: boolean;
  isLast?: boolean;
  formatDateFn: (d: string) => string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "h-3 w-3 rounded-full border-2",
            active
              ? "border-primary bg-primary"
              : "border-muted-foreground/30 bg-background"
          )}
        />
        {!isLast && (
          <div
            className={cn(
              "w-0.5 flex-1 min-h-[24px]",
              active ? "bg-primary" : "bg-muted-foreground/20"
            )}
          />
        )}
      </div>
      <div className="pb-4">
        <p className={cn("text-sm font-medium", active ? "" : "text-muted-foreground")}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{formatDateFn(date)}</p>
      </div>
    </div>
  );
}

const ORDER_STATUS_MAP: Record<string, string> = {
  pending: "orders.statusPending",
  confirmed: "orders.confirmed",
  shipped: "orders.shipped",
  delivered: "orders.delivered",
  cancelled: "orders.cancelled",
  refunded: "orders.refunded",
  processing: "orders.processing",
};

const PAYMENT_STATUS_MAP: Record<string, string> = {
  pending: "orders.statusPending",
  paid: "orders.statusPaid",
  failed: "orders.statusFailed",
  refunded: "orders.refunded",
};

export default function OrdersPage() {
  const config = useStoreConfig();
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { t, getLocalizedValue } = useLanguage();
  const { template } = useStorefrontTemplate();

  const translateStatus = (status: string, map: Record<string, string>) => {
    const key = map[status.toLowerCase()];
    if (key) {
      const translated = t(key);
      if (translated && translated !== key) return translated;
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [ordering, setOrdering] = useState("-created_at");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const { data: ordersData, isLoading: isOrdersLoading, refetch: refetchOrders } = useOrders(
    currentPage,
    ordering
  );
  const { data: selectedOrder, isLoading: isOrderLoading, refetch: refetchOrder } =
    useOrder(selectedOrderId);

  const cancelOrder = async (orderId: number) => {
    setIsCancelling(true);
    try {
      // Cancel endpoint ignores request body; generated type requires OrderRequest fields
      await ecommerceClientOrdersCancelCreate(String(orderId), {} as unknown as import("@/api/generated/interfaces").OrderRequest);
      toast.success(t("orders.cancelled") || "Order cancelled");
      refetchOrders();
      refetchOrder();
    } catch {
      toast.error(t("cart.cancelFailed") || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

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

  // Voltage tenants get the unified account dashboard with the
  // Orders tab pre-selected. Classic continues with this page's body.
  if (template === "voltage" && isAuthenticated) {
    return (
      <StoreLayout>
        <VoltageAccountPage defaultTab="orders" />
      </StoreLayout>
    );
  }

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
        <Breadcrumbs items={[{ label: t("common.myAccount"), href: "/account" }, { label: t("common.myOrders") }]} />
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
                      <Badge className={getStatusColor(String(order.status || ""))}>
                        {getStatusIcon(String(order.status || ""))}
                        <span className="ml-1">
                          {translateStatus(String(order.status || "pending"), ORDER_STATUS_MAP)}
                        </span>
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getPaymentStatusColor(
                          String(order.payment_status || "")
                        )}
                      >
                        <CreditCard className="mr-1 h-3 w-3" />
                        {translateStatus(String(order.payment_status || "pending"), PAYMENT_STATUS_MAP)}
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
            {ordersData.count > 0 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={!ordersData.previous}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  {t("pagination.previous") || t("productsPage.previous")}
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  {t("pagination.pageXofY", {
                    current: String(currentPage),
                    total: String(Math.ceil(ordersData.count / 10)),
                  }) ||
                    `${t("productsPage.page")} ${currentPage} ${t("productsPage.of")} ${Math.ceil(ordersData.count / 10)}`}
                </span>
                <Button
                  variant="outline"
                  disabled={!ordersData.next}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  {t("pagination.next") || t("productsPage.next")}
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
                    className={getStatusColor(String(selectedOrder.status || ""))}
                  >
                    {getStatusIcon(String(selectedOrder.status || ""))}
                    <span className="ml-1">
                      {translateStatus(String(selectedOrder.status || "pending"), ORDER_STATUS_MAP)}
                    </span>
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getPaymentStatusColor(
                      String(selectedOrder.payment_status || "")
                    )}
                  >
                    <CreditCard className="mr-1 h-3 w-3" />
                    {translateStatus(String(selectedOrder.payment_status || "pending"), PAYMENT_STATUS_MAP)}
                  </Badge>
                </div>

                <Separator />

                {/* Order Timeline */}
                <div>
                  <h4 className="mb-3 font-semibold">
                    {t("orders.timeline") || "Order Timeline"}
                  </h4>
                  <div>
                    {selectedOrder.created_at && (
                      <TimelineItem
                        label={t("orders.orderPlaced") || "Order Placed"}
                        date={selectedOrder.created_at}
                        active
                        formatDateFn={formatDate}
                      />
                    )}
                    {selectedOrder.confirmed_at && (
                      <TimelineItem
                        label={t("orders.confirmed") || "Confirmed"}
                        date={selectedOrder.confirmed_at}
                        active
                        formatDateFn={formatDate}
                      />
                    )}
                    {selectedOrder.shipped_at && (
                      <TimelineItem
                        label={t("orders.shipped") || "Shipped"}
                        date={selectedOrder.shipped_at}
                        active
                        formatDateFn={formatDate}
                      />
                    )}
                    {selectedOrder.delivered_at && (
                      <TimelineItem
                        label={t("orders.delivered") || "Delivered"}
                        date={selectedOrder.delivered_at}
                        active
                        isLast
                        formatDateFn={formatDate}
                      />
                    )}
                  </div>
                </div>

                {/* Tracking Number */}
                {selectedOrder.tracking_number && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4" />
                      <span>
                        {t("orders.tracking") || "Tracking"}:{" "}
                        {selectedOrder.tracking_number}
                      </span>
                      {selectedOrder.courier_provider && (
                        <span className="text-muted-foreground">
                          ({selectedOrder.courier_provider})
                        </span>
                      )}
                    </div>
                  </>
                )}

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

                {/* Action buttons */}
                <div className="flex gap-3">
                  {/* Payment URL for pending orders */}
                  {selectedOrder.payment_url &&
                    selectedOrder.payment_status?.toString().toLowerCase() ===
                      "pending" && (
                      <Button asChild className="flex-1">
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

                  {/* Cancel button for pending/confirmed orders */}
                  {["pending", "confirmed"].includes(
                    String(selectedOrder.status || "").toLowerCase()
                  ) && (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => cancelOrder(selectedOrder.id)}
                      disabled={isCancelling}
                    >
                      {isCancelling ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("orders.cancelling") || "Cancelling..."}
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          {t("orders.cancelOrder") || "Cancel Order"}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </StoreLayout>
  );
}
