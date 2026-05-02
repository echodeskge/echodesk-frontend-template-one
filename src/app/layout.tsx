import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreConfigProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { LanguageProvider } from "@/contexts/language-context";
import { TenantProvider } from "@/contexts/tenant-context";
import { StorefrontConfigProvider } from "@/contexts/storefront-config-context";
import { Toaster } from "@/components/ui/sonner";
import { getStoreConfig } from "@/lib/store-config";
import { getTenantConfigFromHeaders } from "@/lib/tenant-utils";
import { fetchStorefrontConfig } from "@/lib/fetch-server";
import {
  getTenantBaseUrl,
  getTenantStoreName,
  getTenantLocale,
} from "@/lib/tenant-url";
import { ThemeSwitcher } from "@/components/demo/theme-switcher";
import { CookieConsent } from "@/components/cookie-consent";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Dynamic metadata based on tenant headers (multi-tenant) with the
// env-driven store config as a localhost-dev fallback. Each tenant
// subdomain emits its own canonical, OG URL, and PWA icons via the
// dynamic /icon and /apple-icon routes (src/app/icon.tsx +
// src/app/apple-icon.tsx) so favicons match the tenant's brand colour.
export async function generateMetadata(): Promise<Metadata> {
  const config = getStoreConfig();
  const baseUrl = await getTenantBaseUrl();
  // Prefer the EcommerceSettings.store_name the tenant actually
  // configured ("Refurb") over the resolve-domain fallback that
  // returns the schema slug ("groot"). The resolve-domain endpoint
  // was previously dropping the configured name because it was
  // querying EcommerceSettings outside a schema_context — fixed on
  // backend in tenants/views.py:1852, but the storefront also reads
  // the proper name straight from the theme endpoint as a defence
  // in depth.
  const storefront = await fetchStorefrontConfig();
  const fallbackStoreName = await getTenantStoreName();
  const storeName = storefront.storeName || fallbackStoreName;
  const tenantLocale = await getTenantLocale();
  const ogLocaleCode = tenantLocale === "ka" ? "ka_GE" : "en_US";
  const altLocale = tenantLocale === "ka" ? "en_US" : "ka_GE";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: storeName,
      template: `%s | ${storeName}`,
    },
    description: config.store.description,
    keywords: ["ecommerce", "online store", "shop", storeName],
    authors: [{ name: storeName }],
    creator: storeName,
    publisher: storeName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    // No `icons` here — Next.js auto-injects <link rel="icon"> +
    // <link rel="apple-touch-icon"> from the dynamic icon.tsx /
    // apple-icon.tsx routes, which generate per-tenant PNGs from the
    // store name + brand colour.
    manifest: "/manifest.json",
    openGraph: {
      type: "website",
      locale: ogLocaleCode,
      alternateLocale: altLocale,
      url: baseUrl,
      siteName: storeName,
      title: storeName,
      description: config.store.description,
      images: [
        {
          url: `${baseUrl}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: storeName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: storeName,
      description: config.store.description,
      images: [`${baseUrl}/opengraph-image`],
      site: config.social.twitter
        ? `@${config.social.twitter.split("/").pop()}`
        : process.env.NEXT_PUBLIC_TWITTER_HANDLE || undefined,
      creator: config.social.twitter
        ? `@${config.social.twitter.split("/").pop()}`
        : process.env.NEXT_PUBLIC_TWITTER_HANDLE || undefined,
    },
    alternates: {
      canonical: baseUrl,
      // Locale switching is cookie-based on the same path — no distinct
      // per-locale URLs to advertise via hreflang. (See echodesk-frontend
      // commit bbecacf for the same reasoning.)
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get tenant configuration from middleware headers (multi-tenant mode)
  // Falls back to environment variables for development/preview
  const tenantConfig = await getTenantConfigFromHeaders();

  // Resolve the tenant's storefront template + Voltage tokens server-side
  // so the SSR'd <html> already carries `data-template` / `data-theme`
  // markers. Without this, the Voltage CSS rules (all gated on
  // `[data-template="voltage"]`) don't apply on first paint and the
  // classic shell flashes for ~500ms before client React swaps it.
  const storefront = await fetchStorefrontConfig();
  const isVoltage = storefront.template === "voltage";

  return (
    <html
      lang={tenantConfig.locale || "en"}
      suppressHydrationWarning
      data-template={storefront.template}
      data-theme={isVoltage ? storefront.voltage.theme : undefined}
      data-mode={isVoltage ? storefront.voltage.mode : undefined}
      data-density={isVoltage ? storefront.voltage.density : undefined}
      data-radius={isVoltage ? storefront.voltage.radius : undefined}
      data-fontpair={isVoltage ? storefront.voltage.fontPair : undefined}
    >
      <head>
        {/* theme-color picks up the tenant's primary HSL via the CSS
            variable the StoreConfigProvider injects. */}
        <meta name="theme-color" content="hsl(var(--primary))" />
        {/* No static <link rel="icon"> here — Next.js auto-injects
            the per-tenant PNGs generated by src/app/icon.tsx and
            src/app/apple-icon.tsx (first letter on brand colour). */}
        <link
          rel="search"
          type="application/opensearchdescription+xml"
          title="Store Search"
          href="/opensearch.xml"
        />
        {tenantConfig.apiUrl && (
          <>
            <link rel="dns-prefetch" href={tenantConfig.apiUrl} />
            <link rel="preconnect" href={tenantConfig.apiUrl} />
          </>
        )}
        {/* Voltage tenants need Bricolage Grotesque + paired UI fonts.
            Inject only when the chosen template needs them so classic
            tenants don't pay the bytes. */}
        {isVoltage && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin="anonymous"
            />
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link
              href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&family=Instrument+Serif&family=DM+Sans:wght@400;500;600;700&display=swap"
              rel="stylesheet"
            />
          </>
        )}
        {/* EchoDesk chat widget — auto-injected when the tenant has the
            embeddable chat enabled in admin (Social Integrations →
            Widget). Uses the standard widget.js bootstrap on
            echodesk.ge which reads the token off its own script src.
            Never blocks paint (`async`); the bootstrap is try/catched
            throughout so a broken tenant config can't break the page. */}
        {storefront.chatWidgetToken && (
          <script
            async
            src={`https://echodesk.ge/widget.js?t=${encodeURIComponent(storefront.chatWidgetToken)}`}
          />
        )}
        {/* Google Ads + GA4 — bootstrap loads only when the tenant has
            configured at least one of (Ads conversion ID, GA4
            measurement ID) in admin → Ecommerce → Marketing. Tenants
            without either don't ship any analytics scripts. Both
            products use the same gtag.js library, so we load it once
            and call `gtag('config', ...)` per ID. The `purchase`
            event itself fires from /order-confirmation when the
            order details load. */}
        {(storefront.googleAdsConversionId || storefront.googleAnalyticsId) && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${storefront.googleAdsConversionId || storefront.googleAnalyticsId}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  ${storefront.googleAdsConversionId ? `gtag('config', '${storefront.googleAdsConversionId}');` : ''}
                  ${storefront.googleAnalyticsId ? `gtag('config', '${storefront.googleAnalyticsId}');` : ''}
                `,
              }}
            />
          </>
        )}
        {/* Microsoft Clarity — heatmaps + session recordings. Loads
            only when the tenant has set a Clarity project ID in
            admin → Marketing. Standard Clarity bootstrap snippet. */}
        {storefront.clarityProjectId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${storefront.clarityProjectId}");
              `,
            }}
          />
        )}
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <TenantProvider config={tenantConfig}>
          <StorefrontConfigProvider config={storefront}>
            <SessionProvider>
              <QueryProvider>
                <AuthProvider>
                  <LanguageProvider>
                    <StoreConfigProvider initialShopName={storefront.storeName}>
                      {children}
                      <Toaster position="bottom-right" />
                      {/* Cookie consent banner — temporarily hidden.
                          Re-enable by un-commenting <CookieConsent />
                          when you're ready to ship the banner again.
                          The component itself is preserved. */}
                      {/* <CookieConsent /> */}
                      <ThemeSwitcher />
                    </StoreConfigProvider>
                  </LanguageProvider>
                </AuthProvider>
              </QueryProvider>
            </SessionProvider>
          </StorefrontConfigProvider>
        </TenantProvider>
      </body>
    </html>
  );
}
