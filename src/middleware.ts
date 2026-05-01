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

  const resolveApiUrl = process.env.NEXT_PUBLIC_RESOLVE_API || 'https://api.echodesk.ge';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    // Call backend API to resolve domain
    const response = await fetch(
      `${resolveApiUrl}/api/public/resolve-domain/?domain=${encodeURIComponent(hostname)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Don't cache at fetch level - we handle caching ourselves
        cache: "no-store",
        signal: controller.signal,
      }
    );

    if (!response.ok) {
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
  } finally {
    clearTimeout(timeout);
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

/**
 * Match the user agent of any bot we want to grant unconditional public
 * access to (link-preview scrapers, search crawlers, ad-quality bots).
 * These never have a session cookie, never need auth gates, and we want
 * to make sure none of the auth/redirect logic ever returns a 4xx for
 * them — Facebook in particular shows "could be a robots.txt block" on
 * any non-200 and the support overhead isn't worth it.
 */
const BOT_UA_RE = /(facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|WhatsApp|Pinterest|redditbot|Applebot|Googlebot|AdsBot-Google|Mediapartners-Google|Storebot-Google|Bingbot|DuckDuckBot|YandexBot|Baiduspider)/i;

function isBot(req: NextRequest): boolean {
  const ua = req.headers.get("user-agent") || "";
  return BOT_UA_RE.test(ua);
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  const isAuthenticated = !!req.auth;
  const bot = isBot(req);

  // For development/preview, skip tenant resolution and use env vars
  if (shouldSkipTenantResolution(hostname)) {
    return handleAuthRoutes(req, pathname, isAuthenticated, bot);
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

  // Compute auth-route handling. If it returns a redirect (e.g.
  // unauthenticated visitor hitting /account), we honour it instead
  // of discarding it — the previous version always overwrote the
  // result with NextResponse.next() below, which meant middleware-
  // level protection of /account / /checkout etc. was effectively
  // disabled and the redirect-to-login only happened later via
  // each page's own client-side useEffect. That created flicker
  // and, on slow auth resolution, looked like "logo bounces me to
  // /login multiple times".
  const authResp = handleAuthRoutes(req, pathname, isAuthenticated, bot);

  // Build the request headers we want server components to read.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-tenant-id", String(tenantConfig.tenant_id));
  requestHeaders.set("x-tenant-schema", tenantConfig.schema);
  requestHeaders.set("x-tenant-api-url", tenantConfig.api_url);
  requestHeaders.set("x-tenant-store-name", tenantConfig.store_name);
  requestHeaders.set("x-tenant-store-logo", tenantConfig.store_logo || "");
  requestHeaders.set("x-tenant-primary-color", tenantConfig.primary_color || "");
  requestHeaders.set("x-tenant-secondary-color", tenantConfig.secondary_color || "");
  requestHeaders.set("x-tenant-accent-color", tenantConfig.accent_color || "");
  requestHeaders.set("x-tenant-currency", tenantConfig.currency);
  requestHeaders.set("x-tenant-locale", tenantConfig.locale);
  requestHeaders.set("x-tenant-contact-email", tenantConfig.contact?.email || "");
  requestHeaders.set("x-tenant-contact-phone", tenantConfig.contact?.phone || "");
  requestHeaders.set("x-tenant-features", JSON.stringify(tenantConfig.features));

  // If auth resolution produced a redirect, return it directly. We
  // don't need the tenant headers on a redirect response — the
  // browser is going to issue a fresh request to the redirect target.
  if (authResp.headers.get("location")) {
    return authResp;
  }

  // Otherwise let the request through with tenant headers attached.
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

/**
 * Handle authentication route logic
 */
function handleAuthRoutes(
  req: NextRequest & { auth?: any },
  pathname: string,
  isAuthenticated: boolean,
  bot: boolean = false
): NextResponse {
  // Bots never authenticate. Send them straight to the rendered page so
  // they can scrape OG tags / JSON-LD. They wouldn't redirect from the
  // protected-route gate either (no session cookie), but skipping the
  // logic guarantees a clean 200 response with no extra cookie churn.
  if (bot) return NextResponse.next();

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
