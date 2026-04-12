import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreConfigProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { LanguageProvider } from "@/contexts/language-context";
import { TenantProvider } from "@/contexts/tenant-context";
import { Toaster } from "@/components/ui/sonner";
import { getStoreConfig } from "@/lib/store-config";
import { getTenantConfigFromHeaders } from "@/lib/tenant-utils";
import { ThemeSwitcher } from "@/components/demo/theme-switcher";
import { CookieConsent } from "@/components/cookie-consent";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Dynamic metadata based on store config
export async function generateMetadata(): Promise<Metadata> {
  const config = getStoreConfig();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourstore.com";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: config.store.name,
      template: `%s | ${config.store.name}`,
    },
    description: config.store.description,
    keywords: ["ecommerce", "online store", "shop", config.store.name],
    authors: [{ name: config.store.name }],
    creator: config.store.name,
    publisher: config.store.name,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: config.store.logo, type: "image/png" },
      ],
      shortcut: config.store.logo,
      apple: [
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    },
    manifest: "/manifest.json",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: baseUrl,
      siteName: config.store.name,
      title: config.store.name,
      description: config.store.description,
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: config.store.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: config.store.name,
      description: config.store.description,
      images: [`${baseUrl}/og-image.png`],
      site: config.social.twitter
        ? `@${config.social.twitter.split("/").pop()}`
        : process.env.NEXT_PUBLIC_TWITTER_HANDLE || undefined,
      creator: config.social.twitter
        ? `@${config.social.twitter.split("/").pop()}`
        : process.env.NEXT_PUBLIC_TWITTER_HANDLE || undefined,
    },
    alternates: {
      canonical: baseUrl,
      languages: {
        en: baseUrl,
        ka: baseUrl,
      },
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
      // yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
      // bing: process.env.NEXT_PUBLIC_BING_VERIFICATION,
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

  return (
    <html lang={tenantConfig.locale || "en"} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon-512.png" sizes="512x512" />
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
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <TenantProvider config={tenantConfig}>
          <SessionProvider>
            <QueryProvider>
              <AuthProvider>
                <LanguageProvider>
                  <StoreConfigProvider>
                    {children}
                    <Toaster position="bottom-right" />
                    <CookieConsent />
                    <ThemeSwitcher />
                  </StoreConfigProvider>
                </LanguageProvider>
              </AuthProvider>
            </QueryProvider>
          </SessionProvider>
        </TenantProvider>
      </body>
    </html>
  );
}
