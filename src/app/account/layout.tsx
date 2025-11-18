import { Metadata } from "next";

/**
 * Account pages metadata - noindex for private pages
 */
export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your account settings and orders",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
