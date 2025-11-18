"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { Loader2 } from "lucide-react";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  message?: string;
}

export function LoginDialog({
  open,
  onOpenChange,
  onSuccess,
  message,
}: LoginDialogProps) {
  const config = useStoreConfig();
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    rememberMe: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login({
        identifier: formData.identifier,
        password: formData.password,
      });

      // Close dialog
      onOpenChange(false);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Reset form
      setFormData({
        identifier: "",
        password: "",
        rememberMe: false,
      });
    } catch (error) {
      // Error is handled in auth context with toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            {t("auth.welcomeBack")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {message ||
              t("auth.signInTo", { storeName: config.store.name })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="dialog-identifier">{t("auth.emailOrPhone")}</Label>
            <Input
              id="dialog-identifier"
              type="text"
              placeholder={t("auth.emailOrPhonePlaceholder")}
              value={formData.identifier}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, identifier: e.target.value }))
              }
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="dialog-password">{t("auth.password")}</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
                onClick={() => onOpenChange(false)}
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>
            <Input
              id="dialog-password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="dialog-remember"
              checked={formData.rememberMe}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  rememberMe: checked === true,
                }))
              }
            />
            <label
              htmlFor="dialog-remember"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t("auth.rememberMe")}
            </label>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("auth.signingIn")}
              </>
            ) : (
              t("auth.signIn")
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("auth.orContinueWith")}
              </span>
            </div>
          </div>

          <div className="text-center text-sm">
            {t("auth.dontHaveAccount")}{" "}
            <Link
              href="/register"
              className="text-primary hover:underline"
              onClick={() => onOpenChange(false)}
            >
              {t("auth.signUp")}
            </Link>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
