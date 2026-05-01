"use client";

/*
 * Voltage cookie consent — bottom banner + preferences modal ported
 * from the prototype's `<CookieConsent>` (templates/echodesk/layout.jsx).
 * Stored under a Voltage-specific key so a tenant who flips templates
 * later doesn't leak categories from one shell into the other.
 */

import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { useTranslate } from "./use-translate";

const CONSENT_KEY = "voltage.consent.v1";

interface ConsentState {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  ts?: string;
}

interface CookieCategory {
  id: keyof Omit<ConsentState, "ts">;
  label: string;
  desc: string;
  required?: boolean;
}

export function VoltageCookieConsent() {
  const t = useTranslate();
  const [state, setState] = useState<ConsentState | null>(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const [visible, setVisible] = useState(false);
  const [prefs, setPrefs] = useState<Omit<ConsentState, "ts">>({
    necessary: true,
    functional: true,
    analytics: true,
    marketing: false,
  });

  // Read previous decision from localStorage on mount only — keeps the
  // SSR markup clean (banner doesn't render until the client decides
  // whether the user has already chosen).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      /* ignore parse errors — treat as no decision */
    }
  }, []);

  // Show the banner ~600ms after first paint, only if no decision yet.
  // The delay lets the hero animation breathe before the dialog drops.
  useEffect(() => {
    if (state) return;
    const handle = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(handle);
  }, [state]);

  const COOKIE_CATS: CookieCategory[] = [
    {
      id: "necessary",
      label: t("cookies.necessaryLabel", "Strictly necessary"),
      desc: t(
        "cookies.necessaryDesc",
        "Cart, checkout, login, fraud prevention. These can't be turned off.",
      ),
      required: true,
    },
    {
      id: "functional",
      label: t("cookies.functionalLabel", "Functional"),
      desc: t(
        "cookies.functionalDesc",
        "Remembers your language, currency, theme, and recent views.",
      ),
    },
    {
      id: "analytics",
      label: t("cookies.analyticsLabel", "Analytics"),
      desc: t(
        "cookies.analyticsDesc",
        "Anonymous usage data so we know which pages are working.",
      ),
    },
    {
      id: "marketing",
      label: t("cookies.marketingLabel", "Marketing"),
      desc: t(
        "cookies.marketingDesc",
        "Personalised offers and ads, on this store and around the web.",
      ),
    },
  ];

  const save = (next: Omit<ConsentState, "ts">) => {
    const decided: ConsentState = { ...next, ts: new Date().toISOString() };
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(decided));
    } catch {
      /* storage quota / private mode — ignore, in-memory state still works */
    }
    setState(decided);
    setVisible(false);
    setShowPrefs(false);
  };

  if (state && !showPrefs) return null;

  return (
    <>
      {visible && !showPrefs && (
        <div
          role="dialog"
          aria-label="Cookie preferences"
          style={{
            position: "fixed",
            left: 16,
            right: 16,
            bottom: 16,
            zIndex: 90,
            animation: "cookieIn .35s cubic-bezier(.2,.9,.3,1.2) both",
          }}
        >
          <div
            className="cookie-banner"
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              background: "var(--bg)",
              color: "var(--ink)",
              border: "1.5px solid var(--ink)",
              borderRadius: "var(--radius)",
              overflow: "hidden",
              boxShadow:
                "0 24px 60px -20px color-mix(in oklch, var(--ink) 35%, transparent), 0 8px 16px -8px color-mix(in oklch, var(--ink) 20%, transparent)",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "var(--accent)",
                  color: "var(--accent-ink)",
                  border: "1.5px solid var(--ink)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 22,
                  lineHeight: 1,
                }}
                aria-hidden="true"
              >
                🍪
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  className="display"
                  style={{ fontSize: 20, lineHeight: 1.1, marginBottom: 4 }}
                >
                  {t(
                    "cookies.title",
                    "We use cookies — but only the useful kind.",
                  )}
                </div>
                <div style={{ fontSize: 13, opacity: 0.78, lineHeight: 1.45 }}>
                  {t(
                    "cookies.subcopy",
                    "Some keep your cart and checkout working. Others help us understand which pages help you find a great deal.",
                  )}{" "}
                  <button
                    type="button"
                    onClick={() => setShowPrefs(true)}
                    style={{
                      background: "transparent",
                      border: 0,
                      padding: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "underline",
                      textUnderlineOffset: 3,
                      cursor: "pointer",
                      color: "inherit",
                    }}
                  >
                    {t("cookies.customize", "Customize")}
                  </button>
                </div>
              </div>
            </div>
            <div
              className="cookie-actions"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "20px 24px 20px 8px",
                borderLeft: "1.5px solid var(--line)",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  save({
                    necessary: true,
                    functional: false,
                    analytics: false,
                    marketing: false,
                  })
                }
                style={{
                  background: "transparent",
                  color: "var(--ink)",
                  border: "1.5px solid var(--ink)",
                  borderRadius: 999,
                  padding: "0 18px",
                  height: 42,
                  fontWeight: 700,
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                {t("cookies.rejectShort", "Reject non-essential")}
              </button>
              <button
                type="button"
                onClick={() =>
                  save({
                    necessary: true,
                    functional: true,
                    analytics: true,
                    marketing: true,
                  })
                }
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-ink)",
                  border: "1.5px solid var(--ink)",
                  borderRadius: 999,
                  padding: "0 22px",
                  height: 42,
                  fontWeight: 700,
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                }}
              >
                {t("cookies.acceptAll", "Accept all")}{" "}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrefs && (
        <div
          onClick={() => setShowPrefs(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Cookie settings"
          style={{
            position: "fixed",
            inset: 0,
            background: "color-mix(in oklch, var(--ink) 55%, transparent)",
            zIndex: 110,
            display: "grid",
            placeItems: "center",
            padding: 16,
            animation: "fadein .2s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(560px, 100%)",
              maxHeight: "90vh",
              overflow: "auto",
              background: "var(--bg)",
              border: "1.5px solid var(--ink)",
              borderRadius: "var(--radius)",
              boxShadow:
                "0 30px 80px -20px color-mix(in oklch, var(--ink) 50%, transparent)",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1.5px solid var(--line)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div className="display" style={{ fontSize: 22 }}>
                {t("cookies.modalTitle", "Cookie settings")}
              </div>
              <button
                type="button"
                onClick={() => setShowPrefs(false)}
                aria-label="Close"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: "var(--muted)",
                  border: 0,
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div style={{ padding: 24, display: "grid", gap: 14 }}>
              {COOKIE_CATS.map((cat) => (
                <label
                  key={cat.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 16,
                    alignItems: "flex-start",
                    padding: 16,
                    border: "1.5px solid var(--line)",
                    borderRadius: "var(--radius-sm)",
                    background: cat.required ? "var(--muted)" : "var(--bg)",
                    cursor: cat.required ? "default" : "pointer",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        marginBottom: 4,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {cat.label}
                      {cat.required && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            background: "var(--ink)",
                            color: "var(--bg)",
                            padding: "2px 6px",
                            borderRadius: 4,
                          }}
                        >
                          {t("cookies.alwaysOn", "ALWAYS ON")}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.7,
                        lineHeight: 1.4,
                      }}
                    >
                      {cat.desc}
                    </div>
                  </div>
                  <Toggle
                    checked={cat.required ? true : prefs[cat.id]}
                    disabled={cat.required}
                    onChange={(v) =>
                      !cat.required &&
                      setPrefs((p) => ({ ...p, [cat.id]: v }))
                    }
                  />
                </label>
              ))}
            </div>
            <div
              style={{
                padding: 20,
                borderTop: "1.5px solid var(--line)",
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  save({
                    necessary: true,
                    functional: false,
                    analytics: false,
                    marketing: false,
                  })
                }
                style={{
                  background: "transparent",
                  border: "1.5px solid var(--line)",
                  color: "var(--ink)",
                  borderRadius: 999,
                  padding: "0 18px",
                  height: 42,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {t("cookies.rejectAll", "Reject all")}
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => save({ ...prefs, necessary: true })}
                  style={{
                    background: "transparent",
                    border: "1.5px solid var(--ink)",
                    color: "var(--ink)",
                    borderRadius: 999,
                    padding: "0 18px",
                    height: 42,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {t("cookies.savePrefs", "Save preferences")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    save({
                      necessary: true,
                      functional: true,
                      analytics: true,
                      marketing: true,
                    })
                  }
                  style={{
                    background: "var(--accent)",
                    color: "var(--accent-ink)",
                    border: "1.5px solid var(--ink)",
                    borderRadius: 999,
                    padding: "0 22px",
                    height: 42,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {t("cookies.acceptAll", "Accept all")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface ToggleProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ checked, disabled, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        padding: 2,
        background: checked ? "var(--accent)" : "var(--line)",
        border: "1.5px solid var(--ink)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
        transition: "background .15s ease",
        display: "inline-flex",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          background: "var(--ink)",
          transform: checked ? "translateX(18px)" : "translateX(0)",
          transition: "transform .18s cubic-bezier(.3,.9,.4,1.2)",
        }}
      />
    </button>
  );
}
