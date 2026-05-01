"use client";

/*
 * Voltage auth page (sign-in / register) — bold split layout: accent-
 * coloured promo column on the left, form column on the right.
 * Ported from `templates/echodesk/pages/auth.jsx`.
 *
 * Wires real backend auth via `useAuth().login` and the existing
 * register API endpoint, so submitting the form actually signs the
 * customer in / creates the account.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Package, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { toast } from "sonner";
import { Btn, Pill } from "../components";
import { useTranslate } from "../use-translate";

interface VoltageAuthPageProps {
  initialMode?: "login" | "register";
}

export function VoltageAuthPage({ initialMode = "login" }: VoltageAuthPageProps) {
  const t = useTranslate();
  useLanguage(); // mounts the provider so useTranslate sees the context
  const router = useRouter();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t("auth.fillRequired", "Please fill in email and password"));
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "login") {
        // Auth context login takes `{ identifier, password }` —
        // identifier may be email or phone.
        await login({ identifier: email, password });
        router.push("/account");
      } else {
        if (!firstName || !lastName) {
          toast.error(t("auth.fillName", "Please enter your name"));
          setSubmitting(false);
          return;
        }
        await register({
          email,
          password,
          password_confirm: password,
          first_name: firstName,
          last_name: lastName,
          phone_number: "",
        });
        toast.success(t("auth.checkEmail", "Check your email for a verification code"));
        // After registration the customer needs to verify; the existing
        // verify flow lives at /verify, but for this PR we point them to
        // login so they can sign in once they've verified.
        setMode("login");
      }
    } catch (err) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (err as Error).message ||
        t("auth.failed", "Something went wrong");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-enter">
      <section
        data-resp="split"
        style={{
          minHeight: "calc(100vh - 200px)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        {/* LEFT — accent promo */}
        <div
          className="auth-hero pad-mobile"
          style={{
            background: "var(--accent)",
            color: "var(--accent-ink)",
            padding: 64,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRight: "1.5px solid var(--ink)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div>
            <Pill style={{ background: "var(--bg)" }}>
              <Zap className="h-3 w-3" /> {t("auth.kicker", "Members")}
            </Pill>
            <h1
              className="display"
              style={{
                fontSize: "clamp(56px, 7vw, 96px)",
                margin: "24px 0",
                lineHeight: 0.95,
              }}
            >
              {mode === "login"
                ? t("auth.welcomeBack", "Welcome back.")
                : t("auth.joinTheClub", "Join the club.")}
            </h1>
            <p style={{ fontSize: 17, maxWidth: 420, opacity: 0.85 }}>
              {t(
                "auth.subcopy",
                "Track orders, save favorites, get exclusive drops, and earn points on every purchase.",
              )}
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, auto)",
              gap: 16,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Perk icon={<Package className="h-4 w-4" />} label={t("auth.perk1", "Free returns")} />
            <Perk icon={<Zap className="h-4 w-4" />} label={t("auth.perk2", "Early access")} />
            <Perk
              icon={<ShieldCheck className="h-4 w-4" />}
              label={t("auth.perk3", "Priority support")}
            />
          </div>
          <div
            style={{
              position: "absolute",
              bottom: -100,
              right: -100,
              width: 320,
              height: 320,
              background: "var(--ink)",
              borderRadius: "50%",
              opacity: 0.06,
            }}
          />
        </div>

        {/* RIGHT — form */}
        <div
          className="pad-mobile"
          style={{
            padding: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 400 }}>
            <div
              style={{
                display: "flex",
                gap: 4,
                padding: 4,
                border: "1.5px solid var(--line)",
                borderRadius: 999,
                marginBottom: 32,
              }}
            >
              {(["login", "register"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setMode(k)}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 999,
                    background: mode === k ? "var(--ink)" : "transparent",
                    color: mode === k ? "var(--bg)" : "var(--ink)",
                    border: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {k === "login"
                    ? t("auth.signIn", "Sign in")
                    : t("auth.createAccount", "Create account")}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              {mode === "register" && (
                <div
                  data-resp="2-1"
                  style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
                >
                  <Field label={t("auth.firstName", "First name")}>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                    />
                  </Field>
                  <Field label={t("auth.lastName", "Last name")}>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                    />
                  </Field>
                </div>
              )}
              <Field label={t("auth.email", "Email")}>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@email.com"
                />
              </Field>
              <Field
                label={t("auth.password", "Password")}
                hint={mode === "login" ? t("auth.forgot", "Forgot?") : t("auth.passwordHint", "8+ characters")}
              >
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                />
              </Field>
            </div>

            <Btn
              variant="ink"
              size="lg"
              type="submit"
              iconRight={<ArrowRight className="h-5 w-5" />}
              style={{ width: "100%", marginTop: 24 }}
              disabled={submitting}
            >
              {submitting
                ? t("auth.submitting", "…")
                : mode === "login"
                ? t("auth.signIn", "Sign in")
                : t("auth.createAccount", "Create account")}
            </Btn>

            <div style={{ marginTop: 16, fontSize: 12, opacity: 0.6, textAlign: "center" }}>
              {mode === "login" ? (
                <>
                  {t("auth.newHere", "New here?")}{" "}
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    style={{
                      background: "transparent",
                      border: 0,
                      textDecoration: "underline",
                      cursor: "pointer",
                      color: "var(--ink)",
                      fontWeight: 600,
                    }}
                  >
                    {t("auth.createAccount", "Create an account")}
                  </button>
                </>
              ) : (
                <>
                  {t("auth.haveAccount", "Already a member?")}{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    style={{
                      background: "transparent",
                      border: 0,
                      textDecoration: "underline",
                      cursor: "pointer",
                      color: "var(--ink)",
                      fontWeight: 600,
                    }}
                  >
                    {t("auth.signIn", "Sign in")}
                  </button>
                </>
              )}
            </div>

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <Link
                href="/"
                style={{ fontSize: 12, opacity: 0.5, textDecoration: "underline" }}
              >
                {t("auth.backToShop", "← Back to shop")}
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

function Perk({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>{label}</span>
        {hint && <span style={{ fontSize: 11, opacity: 0.5 }}>{hint}</span>}
      </div>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        height: 48,
        padding: "0 16px",
        background: "var(--card)",
        border: "1.5px solid var(--line)",
        borderRadius: "var(--radius-sm)",
        fontSize: 14,
        color: "var(--ink)",
        ...props.style,
      }}
    />
  );
}
