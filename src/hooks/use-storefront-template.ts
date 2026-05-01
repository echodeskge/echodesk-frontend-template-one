import { useStorefrontConfig } from "@/contexts/storefront-config-context";

/**
 * Storefront template choice + Voltage tweaks. Resolved server-side in
 * `app/layout.tsx` via `fetchStorefrontConfig()` and injected through
 * `<StorefrontConfigProvider>`, so the first SSR'd HTML already carries
 * the right `<html data-template>` markers and Voltage CSS resolves on
 * the first paint — no flash of the classic shell on refresh.
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

export function useStorefrontTemplate(): StorefrontConfig {
  const config = useStorefrontConfig();
  return {
    template: config.template,
    voltage: {
      theme: config.voltage.theme as VoltageTheme,
      mode: config.voltage.mode,
      density: config.voltage.density,
      radius: config.voltage.radius,
      fontPair: config.voltage.fontPair as VoltageFontPair,
    },
  };
}
