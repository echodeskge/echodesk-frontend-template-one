"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions as setGMapsOptions, importLibrary as importGMapsLibrary } from "@googlemaps/js-api-loader";
import { MapPin, Loader2, Search } from "lucide-react";

/**
 * Google Maps + Places Autocomplete address picker. Drop-in
 * replacement for `AddressMapPicker` (Leaflet) when the tenant has
 * configured a Google Maps API key in admin → Marketing.
 *
 * What it does:
 *   - Loads Google Maps JS once per page.
 *   - Renders a map with a draggable marker.
 *   - Shows a Places Autocomplete input above the map. Picking a
 *     suggestion auto-pins the marker, recenters the map, and (if
 *     `onAddressSelected` is provided) hands the resolved street +
 *     city back to the parent so the address fields can populate.
 *   - Click or drag the marker to refine — the parent gets the
 *     fresh lat/lng via `onChange`.
 *
 * The picker degrades gracefully when the API fails to load
 * (network blocked, bad key, etc.) — shows an inline error and
 * lets the parent fall back to the manual address input.
 */

const DEFAULT_CENTER: google.maps.LatLngLiteral = {
  lat: 41.7151,
  lng: 44.8271,
};

export interface ResolvedAddress {
  street: string;
  city: string;
  formatted: string;
}

type Props = {
  /** Google Maps JS API key from theme config. */
  apiKey: string;
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  /** Called when the user picks an autocomplete suggestion or
   * the marker stops on a known address. Lets the parent populate
   * the visible address + city text fields automatically. */
  onAddressSelected?: (resolved: ResolvedAddress) => void;
  helperText?: string;
  heightPx?: number;
  /** Controlled value for the autocomplete input. When provided,
   * the picker becomes the only address text input — no need for a
   * separate field beside the map. */
  addressValue?: string;
  /** Called whenever the user types into the autocomplete input
   * (free typing, before any suggestion is picked). Use this to
   * keep the parent's address state in sync so submitting the form
   * captures whatever the visitor typed if they didn't pick a
   * suggestion. */
  onAddressInput?: (value: string) => void;
  /** Optional custom placeholder for the autocomplete input. */
  placeholder?: string;
  /** Optional label rendered above the input. */
  label?: string;
};

export function GoogleAddressPicker({
  apiKey,
  latitude,
  longitude,
  onChange,
  onAddressSelected,
  helperText,
  heightPx = 320,
  addressValue,
  onAddressInput,
  placeholder,
  label,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null>(null);
  const placesServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable refs for the callbacks so the loader effect doesn't
  // retrigger every render.
  const onChangeRef = useRef(onChange);
  const onAddressRef = useRef(onAddressSelected);
  const onAddressInputRef = useRef(onAddressInput);
  useEffect(() => {
    onChangeRef.current = onChange;
    onAddressRef.current = onAddressSelected;
    onAddressInputRef.current = onAddressInput;
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // setOptions must run before any importLibrary() call. Idempotent
        // — calling with the same key twice is fine on subsequent
        // mounts of this component.
        setGMapsOptions({ key: apiKey, v: "weekly" });
        await Promise.all([
          importGMapsLibrary("maps"),
          importGMapsLibrary("places"),
          importGMapsLibrary("marker"),
          importGMapsLibrary("geocoding"),
        ]);
        if (cancelled) return;
        if (!mapRef.current) return;

        const center: google.maps.LatLngLiteral =
          typeof latitude === "number" && typeof longitude === "number"
            ? { lat: latitude, lng: longitude }
            : DEFAULT_CENTER;

        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: typeof latitude === "number" ? 16 : 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          mapId: "echodesk-storefront-map",
        });
        mapInstanceRef.current = map;

        // Use AdvancedMarkerElement when available, fall back to legacy Marker.
        let marker: google.maps.marker.AdvancedMarkerElement | google.maps.Marker;
        try {
          marker = new google.maps.marker.AdvancedMarkerElement({
            position: center,
            map,
            gmpDraggable: true,
          });
        } catch {
          marker = new google.maps.Marker({
            position: center,
            map,
            draggable: true,
          });
        }
        markerRef.current = marker;

        const reportLatLng = (lat: number, lng: number) => {
          onChangeRef.current(lat, lng);
        };

        // Drag-to-refine.
        if ("addListener" in marker) {
          marker.addListener("dragend", () => {
            const pos =
              "position" in marker
                ? (marker.position as google.maps.LatLngLiteral | google.maps.LatLng)
                : null;
            if (!pos) return;
            const lat = typeof pos.lat === "function" ? pos.lat() : pos.lat;
            const lng = typeof pos.lng === "function" ? pos.lng() : pos.lng;
            reportLatLng(lat, lng);
            // Reverse-geocode to refresh the resolved address.
            if (geocoderRef.current && onAddressRef.current) {
              geocoderRef.current.geocode(
                { location: { lat, lng } },
                (results, status) => {
                  if (status !== "OK" || !results || !results[0]) return;
                  const resolved = parseAddressResult(results[0]);
                  onAddressRef.current?.(resolved);
                },
              );
            }
          });
        }

        // Click anywhere to drop / move the pin.
        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          if ("position" in marker) {
            (marker.position as unknown) = { lat, lng };
          } else if ("setPosition" in marker) {
            (marker as google.maps.Marker).setPosition({ lat, lng });
          }
          reportLatLng(lat, lng);
          if (geocoderRef.current && onAddressRef.current) {
            geocoderRef.current.geocode(
              { location: { lat, lng } },
              (results, status) => {
                if (status !== "OK" || !results || !results[0]) return;
                onAddressRef.current?.(parseAddressResult(results[0]));
              },
            );
          }
        });

        geocoderRef.current = new google.maps.Geocoder();

        // Places Autocomplete on the input — wire the legacy
        // Autocomplete which is still supported and works without
        // an extra DOM library.
        if (inputRef.current) {
          const ac = new google.maps.places.Autocomplete(inputRef.current, {
            fields: ["geometry", "address_components", "formatted_address", "name"],
            types: ["geocode"],
          });
          ac.bindTo("bounds", map);
          ac.addListener("place_changed", () => {
            const place = ac.getPlace();
            if (!place.geometry?.location) return;
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            map.panTo({ lat, lng });
            map.setZoom(16);
            if ("position" in marker) {
              (marker.position as unknown) = { lat, lng };
            } else if ("setPosition" in marker) {
              (marker as google.maps.Marker).setPosition({ lat, lng });
            }
            reportLatLng(lat, lng);
            const resolved = parsePlaceResult(place);
            // Push the formatted address back into the controlled
            // state so the autocomplete input reflects the picked
            // suggestion (instead of React snapping it back to the
            // previous typed value).
            onAddressInputRef.current?.(resolved.formatted || resolved.street);
            if (onAddressRef.current) {
              onAddressRef.current(resolved);
            }
          });
        }

        setReady(true);
        placesServiceRef.current = new google.maps.places.AutocompleteService();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load Google Maps";
        setError(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
    // We intentionally don't depend on latitude / longitude — the
    // map initialises once. External changes to lat/lng update the
    // marker via the second effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Whenever the parent updates lat/lng (e.g. saved-address selected),
  // move the marker + recenter without rebuilding the map.
  useEffect(() => {
    if (!ready) return;
    if (typeof latitude !== "number" || typeof longitude !== "number") return;
    const map = mapInstanceRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    map.panTo({ lat: latitude, lng: longitude });
    if ("position" in marker) {
      (marker.position as unknown) = { lat: latitude, lng: longitude };
    } else if ("setPosition" in marker) {
      (marker as google.maps.Marker).setPosition({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude, ready]);

  // Auto-pin on typing pause / browser autofill. When the visitor
  // stops typing for 700ms (or the browser pastes a full address
  // via autofill), silently fetch the top Places prediction and
  // drop the pin without requiring an explicit dropdown click.
  // The visible Autocomplete dropdown still works for explicit
  // picks; this is just a fallback so the map stays in sync.
  const lastAutoPinnedRef = useRef<string>("");
  useEffect(() => {
    if (!ready) return;
    if (!addressValue || addressValue.trim().length < 5) return;
    if (addressValue === lastAutoPinnedRef.current) return;
    const trimmed = addressValue.trim();
    const handle = window.setTimeout(() => {
      try {
        const service = new google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          { input: trimmed },
          (predictions, status) => {
            if (
              status !== google.maps.places.PlacesServiceStatus.OK ||
              !predictions ||
              predictions.length === 0
            ) {
              return;
            }
            const top = predictions[0];
            if (!top.place_id) return;
            // Skip if the visitor already explicitly picked this
            // suggestion via the dropdown — avoids double-firing.
            if (lastAutoPinnedRef.current === trimmed) return;
            lastAutoPinnedRef.current = trimmed;
            const map = mapInstanceRef.current;
            if (!map) return;
            const placesService = new google.maps.places.PlacesService(map);
            placesService.getDetails(
              {
                placeId: top.place_id,
                fields: [
                  "geometry",
                  "address_components",
                  "formatted_address",
                  "name",
                ],
              },
              (place, detailStatus) => {
                if (
                  detailStatus !== google.maps.places.PlacesServiceStatus.OK ||
                  !place ||
                  !place.geometry?.location
                ) {
                  return;
                }
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                map.panTo({ lat, lng });
                map.setZoom(16);
                const marker = markerRef.current;
                if (marker) {
                  if ("position" in marker) {
                    (marker.position as unknown) = { lat, lng };
                  } else if ("setPosition" in marker) {
                    (marker as google.maps.Marker).setPosition({ lat, lng });
                  }
                }
                onChangeRef.current(lat, lng);
                const resolved = parsePlaceResult(place);
                onAddressRef.current?.(resolved);
                // Don't re-write the input value — the visitor was
                // typing freely and the dropdown still serves as the
                // explicit pick path. Just update lastAutoPinnedRef
                // so we don't auto-pin to the same prediction twice.
              },
            );
          },
        );
      } catch {
        /* swallow — autocomplete failure is non-blocking */
      }
    }, 700);
    return () => window.clearTimeout(handle);
  }, [addressValue, ready]);

  const hasPin =
    typeof latitude === "number" && typeof longitude === "number";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {helperText ||
            (hasPin
              ? "Search an address or drag the pin to refine"
              : "Search an address — we'll drop a pin on the map")}
        </span>
        {hasPin && (
          <span className="font-mono">
            {latitude!.toFixed(6)}, {longitude!.toFixed(6)}
          </span>
        )}
      </div>

      {/* Autocomplete input — doubles as the address text field when
          the parent passes an `addressValue` controlled value. The
          Google Places Autocomplete library binds to this DOM input
          internally; once the user picks a suggestion, the ref-sync
          effect below pushes the formatted address back into the
          controlled state via onAddressInput. */}
      {label && (
        <label
          htmlFor="google-address-input"
          style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em" }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          id="google-address-input"
          ref={inputRef}
          type="text"
          placeholder={placeholder || "Search address (Tbilisi, Rustaveli Ave 12)…"}
          autoComplete="off"
          {...(addressValue !== undefined
            ? {
                value: addressValue,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                  onAddressInput?.(e.target.value),
              }
            : {})}
          className="w-full pl-9 pr-3 py-2 rounded-md border bg-card text-[14px] outline-none focus:border-foreground"
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ink, #1a1a2e)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "")}
          style={{ height: 46 }}
        />
      </div>

      <div
        className="overflow-hidden rounded-md border"
        style={{ height: `${heightPx}px` }}
      >
        {error ? (
          <div className="flex h-full w-full items-center justify-center text-sm text-destructive p-4 text-center">
            {error} — falling back to manual address entry.
          </div>
        ) : !ready ? (
          <div className="flex h-full w-full items-center justify-center bg-muted/40 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading map…
          </div>
        ) : null}
        <div ref={mapRef} className="h-full w-full" />
      </div>
    </div>
  );
}

function parsePlaceResult(place: google.maps.places.PlaceResult): ResolvedAddress {
  const formatted = place.formatted_address || place.name || "";
  const components = place.address_components || [];
  return parseComponents(components, formatted);
}

function parseAddressResult(result: google.maps.GeocoderResult): ResolvedAddress {
  return parseComponents(result.address_components || [], result.formatted_address || "");
}

function parseComponents(
  components: google.maps.GeocoderAddressComponent[],
  formatted: string,
): ResolvedAddress {
  // Pull the street out of route + street number; pull city out of
  // locality / sublocality / administrative area in that order.
  let route = "";
  let streetNumber = "";
  let city = "";
  for (const c of components) {
    if (c.types.includes("street_number")) streetNumber = c.long_name;
    if (c.types.includes("route")) route = c.long_name;
    if (!city && c.types.includes("locality")) city = c.long_name;
    if (!city && c.types.includes("postal_town")) city = c.long_name;
    if (!city && c.types.includes("sublocality")) city = c.long_name;
    if (!city && c.types.includes("administrative_area_level_2")) city = c.long_name;
    if (!city && c.types.includes("administrative_area_level_1")) city = c.long_name;
  }
  // Fall back to formatted_address minus the city tail when route is missing
  // (e.g. landmark searches).
  const street =
    [route, streetNumber].filter(Boolean).join(" ") ||
    formatted.split(",")[0] ||
    formatted;
  return { street, city, formatted };
}
