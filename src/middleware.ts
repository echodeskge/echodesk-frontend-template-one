import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/account", "/account/addresses", "/account/orders", "/checkout"];

// Routes that should redirect to home if already authenticated
const authRoutes = ["/login", "/register"];

// Tenant configuration cache (in-memory, edge runtime compatible)
const tenantCache = new Map<string, { config: TenantConfig; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface TenantConfig {
  tenant_id: number;
  schema: string;
  api_url: string;
  store_name: string;
  store_logo: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  currency: string;
  locale: string;
  features: {
    ecommerce: boolean;
    wishlist: boolean;
    reviews: boolean;
    compare: boolean;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
}

/**
 * Resolve tenant configuration from hostname
 * Calls the backend API and caches the result for 5 minutes
 */
async function resolveTenant(hostname: string): Promise<TenantConfig | null> {
  // Check cache first
  const cached = tenantCache.get(hostname);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.config;
  }

  try {
    // Call backend API to resolve domain
    const response = await fetch(
      `https://api.echodesk.ge/api/public/resolve-domain/?domain=${encodeURIComponent(hostname)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Don't cache at fetch level - we handle caching ourselves
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.log(`[Middleware] Tenant resolution failed for ${hostname}: ${response.status}`);
      return null;
    }

    const config = await response.json();

    // Cache the result
    tenantCache.set(hostname, {
      config,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return config;
  } catch (error) {
    console.error(`[Middleware] Error resolving tenant for ${hostname}:`, error);
    return null;
  }
}

/**
 * Check if hostname should skip tenant resolution
 */
function shouldSkipTenantResolution(hostname: string): boolean {
  // Skip for Vercel preview deployments
  if (hostname.includes("vercel.app")) return true;
  // Skip for localhost development
  if (hostname.includes("localhost")) return true;
  // Skip for local IPs
  if (hostname.startsWith("127.") || hostname.startsWith("192.168.")) return true;
  return false;
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  const isAuthenticated = !!req.auth;

  // For development/preview, skip tenant resolution and use env vars
  if (shouldSkipTenantResolution(hostname)) {
    return handleAuthRoutes(req, pathname, isAuthenticated);
  }

  // Resolve tenant from hostname
  const tenantConfig = await resolveTenant(hostname);

  if (!tenantConfig) {
    // No tenant found - redirect to store not found page
    // But don't redirect if already on store-not-found to avoid loops
    if (pathname !== "/store-not-found") {
      const notFoundUrl = req.nextUrl.clone();
      notFoundUrl.pathname = "/store-not-found";
      return NextResponse.redirect(notFoundUrl);
    }
    return NextResponse.next();
  }

  // Create response with tenant headers
  const response = handleAuthRoutes(req, pathname, isAuthenticated);

  // Set tenant configuration headers for server components to read
  const headers = new Headers(response.headers);
  headers.set("x-tenant-id", String(tenantConfig.tenant_id));
  headers.set("x-tenant-schema", tenantConfig.schema);
  headers.set("x-tenant-api-url", tenantConfig.api_url);
  headers.set("x-tenant-store-name", tenantConfig.store_name);
  headers.set("x-tenant-store-logo", tenantConfig.store_logo || "");
  headers.set("x-tenant-primary-color", tenantConfig.primary_color || "");
  headers.set("x-tenant-secondary-color", tenantConfig.secondary_color || "");
  headers.set("x-tenant-accent-color", tenantConfig.accent_color || "");
  headers.set("x-tenant-currency", tenantConfig.currency);
  headers.set("x-tenant-locale", tenantConfig.locale);
  headers.set("x-tenant-contact-email", tenantConfig.contact?.email || "");
  headers.set("x-tenant-contact-phone", tenantConfig.contact?.phone || "");

  // Encode features as JSON for complex data
  headers.set("x-tenant-features", JSON.stringify(tenantConfig.features));

  // Return response with headers
  return NextResponse.next({
    request: {
      headers: headers,
    },
  });
});

/**
 * Handle authentication route logic
 */
function handleAuthRoutes(
  req: NextRequest & { auth?: any },
  pathname: string,
  isAuthenticated: boolean
): NextResponse {
  // Check if trying to access protected routes without authentication
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !isAuthenticated) {
    // Use nextUrl to preserve the current origin
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  if (isAuthRoute && isAuthenticated) {
    const homeUrl = req.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
