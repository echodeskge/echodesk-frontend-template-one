import { Metadata } from "next";

/**
 * Register page metadata
 */
export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a new account to start shopping and track your orders",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
