"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

type Step = "register" | "verify";

export default function RegisterPage() {
  const config = useStoreConfig();
  const router = useRouter();
  const { register, verifyEmailCode } = useAuth();
  const { t } = useLanguage();

  const [step, setStep] = useState<Step>("register");
  const [verificationToken, setVerificationToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
    password_confirm: "",
  });

  const [verificationCode, setVerificationCode] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.password_confirm) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await register(formData);
      setVerificationToken(result.verificationToken);
      setStep("verify");
    } catch (error) {
      // Error handled in auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await verifyEmailCode({
        verification_token: verificationToken,
        code: verificationCode,
      });
      router.push("/account");
    } catch (error) {
      // Error handled in auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "verify") {
    return (
      <StoreLayout>
        <div className="container py-16">
          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">
                  {t("auth.verifyEmail") || "Verify Your Email"}
                </CardTitle>
                <CardDescription>
                  {t("auth.verificationCodeSent") ||
                    `We've sent a verification code to ${formData.email}`}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleVerify}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">
                      {t("auth.verificationCode") || "Verification Code"}
                    </Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                  </div>
                  <Button
                    className="w-full"
                    type="submit"
                    disabled={isSubmitting || verificationCode.length < 6}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("auth.verifying") || "Verifying..."}
                      </>
                    ) : (
                      t("auth.verifyAndContinue") || "Verify & Continue"
                    )}
                  </Button>
                </CardContent>
              </form>
              <CardFooter className="flex-col gap-4">
                <p className="text-center text-sm text-muted-foreground">
                  {t("auth.didntReceiveCode") || "Didn't receive the code?"}{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setStep("register")}
                  >
                    {t("auth.tryAgain") || "Try again"}
                  </button>
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container py-16">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {t("auth.createAccount")}
              </CardTitle>
              <CardDescription>
                {t("auth.createAccountDesc") ||
                  `Create your ${config.store.name} account`}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">{t("checkout.firstName")}</Label>
                    <Input
                      id="first_name"
                      type="text"
                      placeholder="John"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          first_name: e.target.value,
                        }))
                      }
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">{t("checkout.lastName")}</Label>
                    <Input
                      id="last_name"
                      type="text"
                      placeholder="Doe"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          last_name: e.target.value,
                        }))
                      }
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">{t("checkout.phone")}</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="+995555123456"
                    value={formData.phone_number}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone_number: e.target.value,
                      }))
                    }
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    required
                    disabled={isSubmitting}
                    minLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_confirm">
                    {t("auth.confirmPassword")}
                  </Label>
                  <Input
                    id="password_confirm"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.password_confirm}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password_confirm: e.target.value,
                      }))
                    }
                    required
                    disabled={isSubmitting}
                    minLength={8}
                  />
                </div>

                <Button className="w-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("auth.creatingAccount") || "Creating Account..."}
                    </>
                  ) : (
                    t("auth.createAccount")
                  )}
                </Button>
              </CardContent>
            </form>
            <CardFooter className="flex-col gap-4">
              <Separator />
              <p className="text-center text-sm text-muted-foreground">
                {t("auth.hasAccount")}{" "}
                <Link href="/login" className="text-primary hover:underline">
                  {t("auth.login")}
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </StoreLayout>
  );
}
