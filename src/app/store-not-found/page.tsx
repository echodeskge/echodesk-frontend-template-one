import { AlertCircle } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Store Not Found",
  description: "The requested store could not be found.",
};

export default function StoreNotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-6 py-12 text-center">
        <div className="mb-8">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Store Not Found
        </h1>

        <p className="text-gray-600 mb-8">
          We couldn&apos;t find the store you&apos;re looking for. This could be
          because:
        </p>

        <ul className="text-left text-gray-600 mb-8 space-y-2">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>The domain or subdomain is not configured correctly</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>The store has been deactivated or removed</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>There&apos;s a typo in the URL</span>
          </li>
        </ul>

        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact the store owner or
            visit{" "}
            <Link
              href="https://echodesk.ge"
              className="text-primary hover:underline"
            >
              echodesk.ge
            </Link>{" "}
            for support.
          </p>

          <Link
            href="https://echodesk.ge"
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Visit Echodesk
          </Link>
        </div>
      </div>
    </div>
  );
}
