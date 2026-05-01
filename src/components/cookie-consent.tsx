"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { useStorefrontTemplate } from "@/hooks/use-storefront-template";

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const { t } = useLanguage();
  const { template } = useStorefrontTemplate();

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) setShow(true);
  }, []);

  // Voltage tenants get the bold ported banner from
  // `templates/voltage/cookie-consent.tsx`, rendered inside the
  // VoltageLayout so it picks up the right tokens. Bail out here so
  // we don't render two banners on top of each other.
  if (template === "voltage") return null;

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50 shadow-lg">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {t("cookies.message") ||
            "We use cookies to improve your experience. By continuing, you agree to our cookie policy."}
        </p>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              localStorage.setItem("cookie_consent", "declined");
              setShow(false);
            }}
          >
            {t("cookies.decline") || "Decline"}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              localStorage.setItem("cookie_consent", "accepted");
              setShow(false);
            }}
          >
            {t("cookies.accept") || "Accept"}
          </Button>
        </div>
      </div>
    </div>
  );
}
