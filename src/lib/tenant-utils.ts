import { headers } from "next/headers";
import { TenantConfig, defaultTenantConfig } from "@/contexts/tenant-context";

/**
 * Get tenant configuration from request headers (Server Components only)
 *
 * This reads the headers set by middleware during tenant resolution.
 * Falls back to environment variables for development/preview.
 *
 * Usage in Server Components:
 * ```tsx
 * import { getTenantConfigFromHeaders } from '@/lib/tenant-utils';
 *
 * export default async function Page() {
 *   const tenant = await getTenantConfigFromHeaders();
 *   return <div>Store: {tenant.storeName}</div>;
 * }
 * ```
 */
export async function getTenantConfigFromHeaders(): Promise<TenantConfig> {
  const headersList = await headers();

  // Check if we have tenant headers (multi-tenant mode)
  const tenantId = headersList.get("x-tenant-id");

  // If no tenant headers, fall back to env vars (development/preview mode)
  if (!tenantId) {
    return defaultTenantConfig;
  }

  // Parse features JSON
  let features = defaultTenantConfig.features;
  try {
    const featuresJson = headersList.get("x-tenant-features");
    if (featuresJson) {
      features = JSON.parse(featuresJson);
    }
  } catch (e) {
    console.error("Failed to parse tenant features:", e);
  }

  return {
    tenantId: tenantId || defaultTenantConfig.tenantId,
    schema: headersList.get("x-tenant-schema") || defaultTenantConfig.schema,
    apiUrl: headersList.get("x-tenant-api-url") || defaultTenantConfig.apiUrl,
    storeName: headersList.get("x-tenant-store-name") || defaultTenantConfig.storeName,
    storeLogo: headersList.get("x-tenant-store-logo") || defaultTenantConfig.storeLogo,
    primaryColor: headersList.get("x-tenant-primary-color") || defaultTenantConfig.primaryColor,
    secondaryColor: headersList.get("x-tenant-secondary-color") || defaultTenantConfig.secondaryColor,
    accentColor: headersList.get("x-tenant-accent-color") || defaultTenantConfig.accentColor,
    currency: headersList.get("x-tenant-currency") || defaultTenantConfig.currency,
    locale: headersList.get("x-tenant-locale") || defaultTenantConfig.locale,
    contactEmail: headersList.get("x-tenant-contact-email") || defaultTenantConfig.contactEmail,
    contactPhone: headersList.get("x-tenant-contact-phone") || defaultTenantConfig.contactPhone,
    features,
  };
}

/**
 * Get just the API URL from headers (Server Components only)
 * Useful for server-side API calls
 */
export async function getTenantApiUrl(): Promise<string> {
  const headersList = await headers();
  return headersList.get("x-tenant-api-url") || defaultTenantConfig.apiUrl;
}

/**
 * Check if running in multi-tenant mode
 */
export async function isMultiTenantMode(): Promise<boolean> {
  const headersList = await headers();
  return !!headersList.get("x-tenant-id");
}
