"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { setTenantApiUrl } from "@/api/axios";

/**
 * Tenant configuration from the backend
 * This is resolved by middleware from the hostname and passed down to components
 */
export interface TenantConfig {
  tenantId: string;
  schema: string;
  apiUrl: string;
  storeName: string;
  storeLogo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  currency: string;
  locale: string;
  contactEmail: string;
  contactPhone: string;
  features: {
    ecommerce: boolean;
    wishlist: boolean;
    reviews: boolean;
    compare: boolean;
  };
}

/**
 * Default tenant config used for development and fallback
 */
export const defaultTenantConfig: TenantConfig = {
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID || "",
  schema: process.env.NEXT_PUBLIC_TENANT_SCHEMA || "",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "https://demo.api.echodesk.ge",
  storeName: process.env.NEXT_PUBLIC_STORE_NAME || "My Store",
  storeLogo: process.env.NEXT_PUBLIC_STORE_LOGO || "",
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "221 83% 53%",
  secondaryColor: process.env.NEXT_PUBLIC_SECONDARY_COLOR || "215 16% 47%",
  accentColor: process.env.NEXT_PUBLIC_ACCENT_COLOR || "221 83% 53%",
  currency: process.env.NEXT_PUBLIC_CURRENCY || "GEL",
  locale: process.env.NEXT_PUBLIC_LOCALE || "en",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "",
  features: {
    ecommerce: true,
    wishlist: process.env.NEXT_PUBLIC_ENABLE_WISHLIST === "true",
    reviews: process.env.NEXT_PUBLIC_ENABLE_REVIEWS === "true",
    compare: process.env.NEXT_PUBLIC_ENABLE_COMPARE === "true",
  },
};

const TenantContext = createContext<TenantConfig>(defaultTenantConfig);

interface TenantProviderProps {
  config: TenantConfig;
  children: ReactNode;
}

/**
 * Provider component that wraps the app and provides tenant configuration
 *
 * Usage in layout.tsx:
 * ```tsx
 * import { TenantProvider } from '@/contexts/tenant-context';
 * import { getTenantConfigFromHeaders } from '@/lib/tenant-utils';
 *
 * export default async function RootLayout({ children }) {
 *   const tenantConfig = await getTenantConfigFromHeaders();
 *   return (
 *     <TenantProvider config={tenantConfig}>
 *       {children}
 *     </TenantProvider>
 *   );
 * }
 * ```
 */
export function TenantProvider({ config, children }: TenantProviderProps) {
  // Set the API URL for axios on client-side mount
  useEffect(() => {
    if (config.apiUrl) {
      setTenantApiUrl(config.apiUrl);
    }
  }, [config.apiUrl]);

  return (
    <TenantContext.Provider value={config}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook to access tenant configuration in client components
 *
 * Usage:
 * ```tsx
 * const tenant = useTenant();
 * console.log(tenant.apiUrl); // https://demo.api.echodesk.ge
 * console.log(tenant.storeName); // My Store
 * ```
 */
export function useTenant(): TenantConfig {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

/**
 * Hook to get the API URL for the current tenant
 * Useful for API calls in client components
 */
export function useTenantApiUrl(): string {
  const tenant = useTenant();
  return tenant.apiUrl;
}

/**
 * Hook to get store information
 */
export function useStoreInfo() {
  const tenant = useTenant();
  return {
    name: tenant.storeName,
    logo: tenant.storeLogo,
    currency: tenant.currency,
    locale: tenant.locale,
    contactEmail: tenant.contactEmail,
    contactPhone: tenant.contactPhone,
  };
}

/**
 * Hook to get feature flags
 */
export function useFeatures() {
  const tenant = useTenant();
  return tenant.features;
}

export default TenantContext;
