import { Metadata } from "next";

/**
 * Checkout page metadata - noindex for private pages
 */
export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your purchase securely",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
