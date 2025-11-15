"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, User, Menu, Heart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useCartCount } from "@/hooks/use-cart";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useState } from "react";

export function Header() {
  const config = useStoreConfig();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const cartCount = useCartCount();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0">
            <div className="flex flex-col h-full">
              {/* Header with logo */}
              <div className="p-6 border-b">
                <Link href="/" className="flex items-center space-x-2">
                  {config.store.logo && config.store.logo !== "/logo.png" && (
                    <Image
                      src={config.store.logo}
                      alt={config.store.name}
                      width={32}
                      height={32}
                      className="h-8 w-8"
                    />
                  )}
                  <span className="font-bold text-lg">{config.store.name}</span>
                </Link>
              </div>

              {/* Navigation links */}
              <nav className="flex flex-col p-4">
                <Link
                  href="/"
                  className="flex items-center px-4 py-3 text-base font-medium rounded-lg hover:bg-muted transition-colors"
                >
                  {t("common.home")}
                </Link>
                <Link
                  href="/products"
                  className="flex items-center px-4 py-3 text-base font-medium rounded-lg hover:bg-muted transition-colors"
                >
                  {t("common.products")}
                </Link>
                <Link
                  href="/products?on_sale=true"
                  className="flex items-center px-4 py-3 text-base font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  {t("common.sale")}
                </Link>
              </nav>

              {/* Account section */}
              {isAuthenticated && (
                <div className="border-t p-4">
                  <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("common.account")}
                  </p>
                  <Link
                    href="/account"
                    className="flex items-center px-4 py-3 text-base font-medium rounded-lg hover:bg-muted transition-colors"
                  >
                    {t("common.myAccount")}
                  </Link>
                  <Link
                    href="/account/orders"
                    className="flex items-center px-4 py-3 text-base font-medium rounded-lg hover:bg-muted transition-colors"
                  >
                    {t("common.myOrders")}
                  </Link>
                  {config.features.wishlist && (
                    <Link
                      href="/wishlist"
                      className="flex items-center px-4 py-3 text-base font-medium rounded-lg hover:bg-muted transition-colors"
                    >
                      {t("common.wishlist")}
                    </Link>
                  )}
                </div>
              )}

              {/* Footer with login/logout */}
              <div className="mt-auto border-t p-4">
                {isAuthenticated ? (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("common.signOut")}
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link href="/login">
                      <User className="mr-2 h-4 w-4" />
                      {t("common.signIn")}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          {config.store.logo && config.store.logo !== "/logo.png" && (
            <Image
              src={config.store.logo}
              alt={config.store.name}
              width={32}
              height={32}
              className="h-8 w-8"
            />
          )}
          <span className="hidden font-bold sm:inline-block">
            {config.store.name}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:flex-1 md:items-center md:gap-6">
          <Link
            href="/products"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            {t("common.products")}
          </Link>
          <Link
            href="/products?on_sale=true"
            className="text-sm font-medium text-red-600 transition-colors hover:text-red-700"
          >
            {t("common.sale")}
          </Link>
        </nav>

        {/* Search */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          <form onSubmit={handleSearch} className="w-full flex-1 md:w-auto md:flex-none">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("common.search")}
                className="w-full pl-8 md:w-[200px] lg:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Wishlist (if enabled) */}
          {config.features.wishlist && isAuthenticated && (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/wishlist">
                <Heart className="h-5 w-5" />
                <span className="sr-only">{t("common.wishlist")}</span>
              </Link>
            </Button>
          )}

          {/* Cart */}
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </Badge>
              )}
              <span className="sr-only">{t("common.cart")}</span>
            </Link>
          </Button>

          {/* Account */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                  <span className="sr-only">{t("common.account")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account">{t("common.myAccount")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/orders">{t("common.myOrders")}</Link>
                </DropdownMenuItem>
                {config.features.wishlist && (
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist">{t("common.wishlist")}</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("common.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/login">
                <User className="h-5 w-5" />
                <span className="sr-only">{t("common.signIn")}</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
