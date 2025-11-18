import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreConfigProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { LanguageProvider } from "@/contexts/language-context";
import { Toaster } from "@/components/ui/sonner";
import { getStoreConfig } from "@/lib/store-config";
import { ThemeSwitcher } from "@/components/demo/theme-switcher";

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
      icon: config.store.logo,
      shortcut: config.store.logo,
      apple: config.store.logo,
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
      creator: "@yourstore",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>
          <QueryProvider>
            <AuthProvider>
              <LanguageProvider>
                <StoreConfigProvider>
                  {children}
                  <Toaster position="top-right" />
                  <ThemeSwitcher />
                </StoreConfigProvider>
              </LanguageProvider>
            </AuthProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
