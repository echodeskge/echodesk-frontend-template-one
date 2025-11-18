import { Metadata } from "next";

/**
 * Wishlist page metadata - basic SEO
 */
export const metadata: Metadata = {
  title: "My Wishlist",
  description: "View and manage your saved products",
  robots: {
    index: false,
    follow: true,
  },
};

export default function WishlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
