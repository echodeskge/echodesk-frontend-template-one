"use client";

/*
 * `useTranslate` — Voltage's wrapper around `useLanguage().t()` that
 * actually falls back to a default English string when a translation
 * is missing.
 *
 * Why we need it:
 *   The storefront's `t()` returns the key string itself (`"foo.bar"`)
 *   when a translation isn't found, so the common pattern
 *   `t("foo.bar") || "Default"` never short-circuits — JS treats the
 *   non-empty key string as truthy and the user sees the raw key.
 *
 *   `useTranslate()` returns a function that compares `t(key)` to the
 *   key itself; if they match (= missing translation) it returns the
 *   inline `fallback` argument instead. Voltage components use this
 *   exclusively so any string with a designed fallback always renders.
 */

import { useLanguage } from "@/contexts/language-context";

export function useTranslate() {
  const { t } = useLanguage();
  return (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
}
