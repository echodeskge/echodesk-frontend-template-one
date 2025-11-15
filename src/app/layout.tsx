import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreConfigProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { LanguageProvider } from "@/contexts/language-context";
import { Toaster } from "@/components/ui/sonner";
import { getStoreConfig } from "@/lib/store-config";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Dynamic metadata based on store config
export async function generateMetadata(): Promise<Metadata> {
  const config = getStoreConfig();

  return {
    title: {
      default: config.store.name,
      template: `%s | ${config.store.name}`,
    },
    description: config.store.description,
    icons: {
      icon: config.store.logo,
    },
    openGraph: {
      title: config.store.name,
      description: config.store.description,
      type: "website",
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
        <QueryProvider>
          <AuthProvider>
            <LanguageProvider>
              <StoreConfigProvider>
                {children}
                <Toaster position="top-right" />
              </StoreConfigProvider>
            </LanguageProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
