"use client";

import { Header } from "./header";
import { Footer } from "./footer";
import { VoltageLayout } from "@/templates/voltage/voltage-layout";
import { useStorefrontTemplate } from "@/hooks/use-storefront-template";

interface StoreLayoutProps {
  children: React.ReactNode;
}

/**
 * The `<StoreLayout>` is the root storefront shell every page wraps in.
 * It now branches on the tenant's chosen `storefront_template`:
 *
 * - `classic` (default): the existing shadcn-styled `<Header>` / `<Footer>`.
 * - `voltage`: the bold electronics shell from `templates/voltage/`.
 *
 * The template flag is fetched once via `useStorefrontTemplate` (cached
 * for 5 min, shared across pages) and applied at the layout level so
 * every individual page (`/products`, `/cart`, etc.) automatically picks
 * up whichever shell the tenant configured — no per-page wiring.
 */
export function StoreLayout({ children }: StoreLayoutProps) {
  const { template } = useStorefrontTemplate();

  if (template === "voltage") {
    return <VoltageLayout>{children}</VoltageLayout>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
