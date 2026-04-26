import { headers } from "next/headers";

/**
 * Server-only helpers that read tenant context from the request headers
 * the middleware (`src/middleware.ts`) sets on every server-rendered
 * request. Use these instead of `process.env.NEXT_PUBLIC_BASE_URL` so
 * canonical / OG / structured-data URLs reflect the actual tenant
 * domain (`artlighthouse.ecommerce.echodesk.ge`, etc.) instead of the
 * `yourstore.com` placeholder that lingers when the env var isn't set.
 */

/**
 * Best-effort host discovery from headers. Tries the host header first,
 * falls back to x-forwarded-host (some CDNs split host into two), and
 * finally to a sane default (the env var, then the platform-wide
 * marketing domain).
 */
async function readHost(): Promise<string> {
  try {
    const h = await headers();
    return (
      h.get("host") ||
      h.get("x-forwarded-host") ||
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, "") ||
      "echodesk.ge"
    );
  } catch {
    // headers() can throw outside a request scope (e.g. during static
    // generation of pages without dynamic data). Return the env fallback.
    return (
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, "") ||
      "echodesk.ge"
    );
  }
}

async function readProto(): Promise<"http" | "https"> {
  try {
    const h = await headers();
    const fwd = h.get("x-forwarded-proto");
    if (fwd === "http" || fwd === "https") return fwd;
  } catch {
    /* fallthrough */
  }
  // localhost dev should be http; everything else assume https.
  const host = await readHost();
  if (host.startsWith("localhost") || host.startsWith("127.")) return "http";
  return "https";
}

/**
 * Absolute origin for the current tenant — e.g.
 * `https://artlighthouse.ecommerce.echodesk.ge`.
 */
export async function getTenantBaseUrl(): Promise<string> {
  const proto = await readProto();
  const host = await readHost();
  return `${proto}://${host}`;
}

/**
 * Build a fully-qualified URL on the current tenant.
 */
export async function getTenantUrl(path: string): Promise<string> {
  const base = await getTenantBaseUrl();
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * Tenant's store name from the `x-tenant-store-name` header set by
 * middleware. Falls back to the env-provided name if middleware didn't
 * fire (e.g. localhost dev).
 */
export async function getTenantStoreName(): Promise<string> {
  try {
    const h = await headers();
    const fromHeader = h.get("x-tenant-store-name");
    if (fromHeader) return fromHeader;
  } catch {
    /* fallthrough */
  }
  return process.env.NEXT_PUBLIC_STORE_NAME || "EchoDesk Store";
}

/**
 * Tenant's locale (ka or en) from the middleware-set header.
 */
export async function getTenantLocale(): Promise<"ka" | "en"> {
  try {
    const h = await headers();
    const v = h.get("x-tenant-locale");
    if (v === "ka" || v === "en") return v;
  } catch {
    /* fallthrough */
  }
  const env = process.env.NEXT_PUBLIC_LOCALE;
  return env === "en" ? "en" : "ka";
}

/**
 * Tenant's active currency code (defaulting to GEL — most echodesk-cloud
 * tenants are Georgian). Used in product SEO + currency-bearing
 * structured data.
 */
export async function getTenantCurrency(): Promise<string> {
  try {
    const h = await headers();
    const v = h.get("x-tenant-currency");
    if (v) return v;
  } catch {
    /* fallthrough */
  }
  return process.env.NEXT_PUBLIC_CURRENCY || "GEL";
}

/**
 * Tenant's primary brand colour, normalised to a CSS-friendly value.
 * The middleware passes the raw form stored on the backend
 * (typically space-separated HSL components like "221 83% 53%" so it
 * can be dropped into a Tailwind `hsl(var(--…))` token), but
 * ImageResponse / OG renderers want a complete CSS colour. We accept
 * either form here.
 *
 * Returns an `hsl(...)` string ready for direct use in a CSS
 * `background:` declaration or Satori's inline-style prop.
 */
export async function getTenantPrimaryColor(): Promise<string> {
  let raw = "";
  try {
    const h = await headers();
    raw = (h.get("x-tenant-primary-color") || "").trim();
  } catch {
    /* fallthrough */
  }
  if (!raw) raw = (process.env.NEXT_PUBLIC_PRIMARY_COLOR || "").trim();

  if (!raw) {
    // Sensible neutral default — matches the marketing-site brand purple.
    return "hsl(241 41% 33%)";
  }
  // Already a complete CSS colour (`#abc`, `hsl(...)`, `rgb(...)`).
  if (raw.startsWith("#") || raw.startsWith("hsl") || raw.startsWith("rgb")) {
    return raw;
  }
  // Backend's "H S% L%" components — wrap into hsl().
  return `hsl(${raw})`;
}

/**
 * The single uppercase ASCII glyph to render in tenant favicon-style
 * surfaces (favicon, splash logo, header pill). Strips emoji /
 * punctuation, keeps the first alphabetic codepoint, falls back to
 * "E" for tenants whose name starts with something exotic.
 */
export async function getTenantInitial(): Promise<string> {
  const name = await getTenantStoreName();
  for (const ch of name) {
    if (/\p{L}/u.test(ch)) return ch.toUpperCase();
  }
  return "E";
}
