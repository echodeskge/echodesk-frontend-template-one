import { useQuery } from "@tanstack/react-query";
import { getStoreTheme } from "@/api/generated/api";

/**
 * Storefront template choice + Voltage tweaks, served by the public
 * `getStoreTheme()` endpoint at `/api/ecommerce/client/theme/`.
 *
 * The classic shell ignores everything but `template` (which only
 * matters when the tenant flips to Voltage). Voltage reads the rest
 * to populate `data-*` attributes on `<html>` so the CSS variables
 * in `voltage.css` resolve to the right preset.
 *
 * The endpoint is cheap and already cached by `theme-provider.tsx`
 * via React Query, but `useQuery` here lives under its own key so the
 * hook is safe to call from any tree (including a `<StoreLayout>`
 * that wraps the entire app, before any provider mounts).
 */

export type StorefrontTemplate = "classic" | "voltage";
export type VoltageTheme = "refurb" | "cobalt" | "ember" | "forest" | "violet" | "mono" | "rose";
export type VoltageMode = "light" | "dark";
export type VoltageDensity = "compact" | "cozy" | "comfortable";
export type VoltageRadius = "sharp" | "soft" | "rounded";
export type VoltageFontPair = "bricolage-inter" | "space-dm" | "serif-inter" | "mono-inter";

export interface VoltageTokens {
  theme: VoltageTheme;
  mode: VoltageMode;
  density: VoltageDensity;
  radius: VoltageRadius;
  fontPair: VoltageFontPair;
}

export interface StorefrontConfig {
  template: StorefrontTemplate;
  voltage: VoltageTokens;
}

const DEFAULT: StorefrontConfig = {
  template: "classic",
  voltage: {
    theme: "refurb",
    mode: "light",
    density: "cozy",
    radius: "soft",
    fontPair: "bricolage-inter",
  },
};

/**
 * Pull the `storefront` block out of the theme endpoint. Until the
 * backend regen lands the field is missing — return the default so
 * existing tenants render the classic shell unchanged.
 */
export function useStorefrontTemplate(): StorefrontConfig {
  const { data } = useQuery({
    queryKey: ["storefront-template"],
    queryFn: () => getStoreTheme(),
    staleTime: 5 * 60 * 1000,
  });
  if (!data) return DEFAULT;
  // The generated `StoreThemeResponse` type doesn't yet carry the new
  // `storefront` field — this widens just enough to read it.
  const sf = (data as unknown as { storefront?: Partial<StorefrontConfig> }).storefront;
  if (!sf) return DEFAULT;
  return {
    template: sf.template ?? "classic",
    voltage: { ...DEFAULT.voltage, ...(sf.voltage ?? {}) },
  };
}
