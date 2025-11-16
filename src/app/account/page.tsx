"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useOrders } from "@/hooks/use-orders";
import { formatPrice } from "@/lib/store-config";
import {
  User,
  Package,
  MapPin,
  CreditCard,
  Heart,
  LogOut,
  ChevronRight,
} from "lucide-react";

export default function AccountPage() {
  const config = useStoreConfig();
  const router = useRouter();
  const { t } = useLanguage();
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { data: ordersData, isLoading: isOrdersLoading } = useOrders(1, "-created_at");

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
      case "pending":
        return "bg-blue-500";
      case "shipped":
        return "bg-amber-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isAuthLoading) {
    return (
      <StoreLayout>
        <div className="container py-8">
          <div className="space-y-8">
            <Skeleton className="h-10 w-48" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("account.title")}</h1>
            <p className="mt-1 text-muted-foreground">
              {t("account.welcomeBack")}, {user?.first_name || "User"}
            </p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("common.signOut")}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Profile */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-4 pb-4">
              <User className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>{t("account.profile")}</CardTitle>
                <CardDescription>{t("account.profileDesc")}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-1 text-sm">
                <p className="font-medium">{user?.full_name}</p>
                <p className="text-muted-foreground">{user?.email}</p>
                <p className="text-muted-foreground">{user?.phone_number}</p>
              </div>
              <Button variant="ghost" className="w-full justify-between" asChild>
                <Link href="/account/profile">
                  {t("account.editProfile")}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-4 pb-4">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>{t("account.ordersTitle")}</CardTitle>
                <CardDescription>{t("account.ordersDesc")}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-2xl font-bold">{ordersData?.count || 0}</p>
                <p className="text-sm text-muted-foreground">{t("account.totalOrders")}</p>
              </div>
              <Button variant="ghost" className="w-full justify-between" asChild>
                <Link href="/account/orders">
                  {t("account.viewAllOrders")}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-4 pb-4">
              <MapPin className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>{t("account.addressesTitle")}</CardTitle>
                <CardDescription>{t("account.addressesDesc")}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-2xl font-bold">{user?.addresses?.length || 0}</p>
                <p className="text-sm text-muted-foreground">{t("account.savedAddresses")}</p>
              </div>
              <Button variant="ghost" className="w-full justify-between" asChild>
                <Link href="/account/addresses">
                  {t("account.manageAddresses")}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Wishlist */}
          {config.features.wishlist && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <Heart className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>{t("account.wishlistTitle")}</CardTitle>
                  <CardDescription>{t("account.wishlistDesc")}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  className="w-full justify-between"
                  asChild
                >
                  <Link href="/wishlist">
                    {t("account.viewWishlist")}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Orders */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("account.recentOrders")}</CardTitle>
              <Button variant="ghost" asChild>
                <Link href="/account/orders">{t("account.viewAll")}</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isOrdersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : !ordersData?.results?.length ? (
              <p className="text-center text-muted-foreground">
                {t("account.noOrdersYet")}
              </p>
            ) : (
              <div className="space-y-4">
                {ordersData.results.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()} •{" "}
                        {order.total_items} items
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(order.status as any)}>
                        {String(order.status || "pending")
                          .charAt(0)
                          .toUpperCase() +
                          String(order.status || "pending").slice(1)}
                      </Badge>
                      <p className="mt-1 font-medium">
                        {formatPrice(
                          parseFloat(order.total_amount),
                          config.locale.currency,
                          config.locale.locale
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StoreLayout>
  );
}
