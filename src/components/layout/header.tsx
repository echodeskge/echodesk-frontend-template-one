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
          <SheetContent side="left" className="w-[300px]">
            <nav className="flex flex-col gap-4">
              <Link href="/" className="text-lg font-semibold">
                {t("common.home")}
              </Link>
              <Link href="/products" className="text-lg font-semibold">
                {t("common.products")}
              </Link>
              <Link href="/products?on_sale=true" className="text-lg font-semibold text-red-600">
                {t("common.sale")}
              </Link>
              {isAuthenticated && (
                <>
                  <Link href="/account" className="text-lg font-semibold">
                    {t("common.myAccount")}
                  </Link>
                  <Link href="/account/orders" className="text-lg font-semibold">
                    {t("common.myOrders")}
                  </Link>
                </>
              )}
            </nav>
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
