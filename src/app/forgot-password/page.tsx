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
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";

type Step = "request" | "confirm" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { requestPasswordReset, confirmPasswordReset } = useAuth();
  const { t } = useLanguage();

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await requestPasswordReset(email);
      setStep("confirm");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          t("auth.resetRequestFailed") ||
          "Failed to send reset code. Please check your email and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmNewPassword) {
      setError(
        t("auth.passwordsMismatch") || "Passwords do not match."
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        t("auth.passwordTooShort") ||
          "Password must be at least 8 characters."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await confirmPasswordReset({
        email,
        code,
        new_password: newPassword,
        new_password_confirm: confirmNewPassword,
      });
      setStep("done");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          t("auth.resetConfirmFailed") ||
          "Failed to reset password. Please check your code and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "done") {
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
                  {t("auth.passwordResetSuccess") || "Password Reset Successful"}
                </CardTitle>
                <CardDescription>
                  {t("auth.passwordResetSuccessDesc") ||
                    "Your password has been reset. You can now log in with your new password."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => router.push("/login")}
                >
                  {t("auth.backToLogin") || "Back to Login"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (step === "confirm") {
    return (
      <StoreLayout>
        <div className="container py-16">
          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  {t("auth.resetPassword") || "Reset Password"}
                </CardTitle>
                <CardDescription>
                  {t("auth.enterResetCode") ||
                    `Enter the code sent to ${email} and your new password.`}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleConfirmReset}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">
                      {t("auth.resetCode") || "Reset Code"}
                    </Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="Enter code"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value);
                        setError("");
                      }}
                      required
                      disabled={isSubmitting}
                      className="text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">
                      {t("auth.newPassword") || "New Password"}
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Min. 8 characters"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError("");
                      }}
                      required
                      disabled={isSubmitting}
                      minLength={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">
                      {t("auth.confirmPassword") || "Confirm Password"}
                    </Label>
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      placeholder="Confirm your new password"
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        setError("");
                      }}
                      required
                      disabled={isSubmitting}
                      minLength={8}
                    />
                  </div>
                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}
                  <Button
                    className="w-full"
                    type="submit"
                    disabled={isSubmitting || code.length < 4}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("auth.resetting") || "Resetting..."}
                      </>
                    ) : (
                      t("auth.resetPassword") || "Reset Password"
                    )}
                  </Button>
                </CardContent>
              </form>
              <CardFooter className="flex-col gap-4">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-primary"
                  onClick={() => setStep("request")}
                >
                  {t("auth.resendCode") || "Resend code"}
                </button>
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
                {t("auth.forgotPassword") || "Forgot Password"}
              </CardTitle>
              <CardDescription>
                {t("auth.forgotPasswordDesc") ||
                  "Enter your email and we'll send you a code to reset your password."}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleRequestReset}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {t("auth.email") || "Email"}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                <Button
                  className="w-full"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("auth.sending") || "Sending..."}
                    </>
                  ) : (
                    t("auth.sendResetCode") || "Send Reset Code"
                  )}
                </Button>
              </CardContent>
            </form>
            <CardFooter className="flex-col gap-4">
              <Separator />
              <Link
                href="/login"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("auth.backToLogin") || "Back to Login"}
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </StoreLayout>
  );
}
