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
  /** Controlled value for the autocomplete input — when present,
   * the picker becomes the only address-text input on the page. */
  addressValue?: string;
  /** Called as the user types or picks a suggestion. Use to keep
   * the parent's address state in sync. */
  onAddressInput?: (value: string) => void;
  placeholder?: string;
  label?: string;
};

export function SmartAddressPicker(props: Props) {
  const { googleMapsApiKey } = useStorefrontConfig();
  if (googleMapsApiKey) {
    return <GoogleAddressPicker apiKey={googleMapsApiKey} {...props} />;
  }
  // Leaflet doesn't have autocomplete — strip the Google-only props
  // so it receives only the shared lat/lng + onChange surface.
  const {
    addressValue: _av,
    onAddressInput: _oai,
    placeholder: _ph,
    label: _lb,
    onAddressSelected: _oas,
    ...leafletProps
  } = props;
  void _av;
  void _oai;
  void _ph;
  void _lb;
  void _oas;
  return <AddressMapPicker {...leafletProps} />;
}
