"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { StorefrontConfig } from "@/lib/fetch-server";

/**
 * Server-decided storefront template + Voltage tokens, injected by the
 * root layout. Components read this synchronously — no waiting on a
 * React Query roundtrip after hydration, so there's no flash of the
 * wrong template on first paint.
 */
const StorefrontConfigContext = createContext<StorefrontConfig | null>(null);

interface StorefrontConfigProviderProps {
  config: StorefrontConfig;
  children: ReactNode;
}

export function StorefrontConfigProvider({
  config,
  children,
}: StorefrontConfigProviderProps) {
  return (
    <StorefrontConfigContext.Provider value={config}>
      {children}
    </StorefrontConfigContext.Provider>
  );
}

export function useStorefrontConfig(): StorefrontConfig {
  const value = useContext(StorefrontConfigContext);
  if (!value) {
    throw new Error(
      "useStorefrontConfig must be used inside <StorefrontConfigProvider>",
    );
  }
  return value;
}
