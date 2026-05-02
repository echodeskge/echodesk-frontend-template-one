"use client";

import { AddressMapPicker } from "./address-map-picker";
import { GoogleAddressPicker, type ResolvedAddress } from "./google-address-picker";
import { useStorefrontConfig } from "@/contexts/storefront-config-context";

/**
 * Drop-in address picker that uses Google Maps + Places Autocomplete
 * when the tenant has configured a Google Maps API key in admin →
 * Marketing, and falls back to Leaflet/OpenStreetMap when they
 * haven't (so the picker still works for tenants who haven't set up
 * a GCP project).
 *
 * Same prop surface as the Leaflet picker plus an optional
 * `onAddressSelected` that the Google picker fires when the user
 * picks an autocomplete suggestion — letting the parent populate
 * the visible address fields automatically.
 */

type Props = {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  /** Google Maps only — fired with the resolved street/city when
   * the user picks an autocomplete suggestion or drags the marker
   * to a known address. Ignored when the picker falls back to
   * Leaflet (no autocomplete on OSM). */
  onAddressSelected?: (resolved: ResolvedAddress) => void;
  helperText?: string;
  heightPx?: number;
};

export function SmartAddressPicker(props: Props) {
  const { googleMapsApiKey } = useStorefrontConfig();
  if (googleMapsApiKey) {
    return <GoogleAddressPicker apiKey={googleMapsApiKey} {...props} />;
  }
  return <AddressMapPicker {...props} />;
}
