import { Metadata } from "next";

/**
 * Cart page metadata - noindex for private pages
 */
export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "Review your shopping cart and proceed to checkout",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
