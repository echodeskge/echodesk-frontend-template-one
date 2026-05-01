"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { Loader2 } from "lucide-react";
import { useStorefrontTemplate } from "@/hooks/use-storefront-template";
import { VoltageAuthPage } from "@/templates/voltage/pages/auth";

function LoginForm() {
  const config = useStoreConfig();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const safeCallback = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/account";
  const { login, isLoading } = useAuth();
  const { t } = useLanguage();
  const { template } = useStorefrontTemplate();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    rememberMe: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError("");

    try {
      await login({
        identifier: formData.identifier,
        password: formData.password,
      });
      // Use a full-page navigation so the browser sends the fresh
      // NextAuth session cookie on the next request. router.push()
      // does a client-side soft nav and the in-memory useSession()
      // cache is still anonymous — that meant /account's
      // isAuthenticated guard immediately bounced the visitor back
      // to /login (the "login successful toast then loops to login"
      // bug, especially visible on custom domains).
      window.location.assign(safeCallback);
      return;
    } catch (error: any) {
      setLoginError(
        t("auth.invalidCredentials") ||
          "Invalid email/phone or password. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Voltage tenants get the bold split-screen auth page. Classic
  // continues with the existing centred card body. All hooks above
  // already ran (rules-of-hooks compliant).
  if (template === "voltage") {
    return (
      <StoreLayout>
        <VoltageAuthPage initialMode="login" />
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container py-16">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t("auth.welcomeBack")}</CardTitle>
              <CardDescription>
                {t("auth.signInTo", { storeName: config.store.name })}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="identifier">{t("auth.emailOrPhone")}</Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder={t("auth.emailOrPhonePlaceholder")}
                    value={formData.identifier}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, identifier: e.target.value }));
                      setLoginError("");
                    }}
                    required
                    disabled={isSubmitting}
                    className={loginError ? "border-destructive" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      {t("auth.forgotPassword")}
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, password: e.target.value }));
                      setLoginError("");
                    }}
                    required
                    disabled={isSubmitting}
                    className={loginError ? "border-destructive" : ""}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        rememberMe: checked === true,
                      }))
                    }
                    disabled={isSubmitting}
                  />
                  <label htmlFor="remember" className="text-sm">
                    {t("auth.rememberMe")}
                  </label>
                </div>
                {loginError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{loginError}</p>
                  </div>
                )}
                <Button className="w-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("auth.signingIn")}
                    </>
                  ) : (
                    t("auth.signIn")
                  )}
                </Button>
              </CardContent>
            </form>
            <CardFooter className="flex-col gap-4">
              <Separator />
              <p className="text-center text-sm text-muted-foreground">
                {t("auth.noAccount")}{" "}
                <Link
                  href="/register"
                  className="text-primary hover:underline"
                >
                  {t("auth.createAccount")}
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </StoreLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
