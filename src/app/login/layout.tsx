import { Metadata } from "next";

/**
 * Login page metadata
 */
export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your account to access your orders and saved items",
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
