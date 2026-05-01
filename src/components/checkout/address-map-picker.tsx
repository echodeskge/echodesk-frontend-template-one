"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, MapPin } from "lucide-react";

// Default centre = Tbilisi. Every Georgian tenant ships somewhere
// inside the country; we don't know the user's home so we centre on
// the capital and let them pan/click.
const DEFAULT_CENTER: [number, number] = [41.7151, 44.8271];
const DEFAULT_ZOOM = 12;

// Leaflet touches `window` at import time → must be ssr:false. Doing it
// once at module scope keeps the chunk lazy + memoised across renders.
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false },
);

// react-leaflet 5's `useMapEvents` is a hook, not a component. Wrap it in
// a tiny client component that registers click handlers and emits
// updates upward.
const MapClickLayer = dynamic(
  () =>
    import("react-leaflet").then(({ useMapEvents }) => {
      function Inner({ onPick }: { onPick: (lat: number, lng: number) => void }) {
        useMapEvents({
          click(e) {
            onPick(e.latlng.lat, e.latlng.lng);
          },
        });
        return null;
      }
      return Inner;
    }),
  { ssr: false },
);

type Props = {
  /** Pinned latitude. ``null`` if no pin yet. */
  latitude: number | null;
  /** Pinned longitude. ``null`` if no pin yet. */
  longitude: number | null;
  /** Called whenever the user clicks the map or drags the marker. */
  onChange: (lat: number, lng: number) => void;
  /** Optional helper label rendered above the map. */
  helperText?: string;
  /** Map height in px. Defaults to 320 — tall enough to be useful in a checkout column. */
  heightPx?: number;
};

/**
 * Leaflet + OpenStreetMap delivery-address pin picker for the storefront
 * checkout. No API keys, no per-request billing — uses the public OSM
 * tile servers. Required when the tenant has Quickshipper enabled
 * because the courier API needs a (lat, lng) pair on the drop-off
 * address to compute a quote and book the courier.
 */
export function AddressMapPicker({
  latitude,
  longitude,
  onChange,
  helperText,
  heightPx = 320,
}: Props) {
  const center = useMemo<[number, number]>(() => {
    if (typeof latitude === "number" && typeof longitude === "number") {
      return [latitude, longitude];
    }
    return DEFAULT_CENTER;
  }, [latitude, longitude]);

  // Leaflet's default marker uses Webpack-relative URLs that Next.js
  // can't resolve — patch them to the unpkg CDN once on mount so a marker
  // actually renders.
  const [iconReady, setIconReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      // @ts-expect-error - private API but it's the standard fix
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      if (!cancelled) setIconReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasPin = typeof latitude === "number" && typeof longitude === "number";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {helperText ||
            (hasPin
              ? "Click or drag the pin to refine the delivery location"
              : "Click on the map to drop a pin where the courier should deliver")}
        </span>
        {hasPin && (
          <span className="font-mono">
            {latitude!.toFixed(6)}, {longitude!.toFixed(6)}
          </span>
        )}
      </div>
      <div
        className="overflow-hidden rounded-md border"
        style={{ height: `${heightPx}px` }}
      >
        {!iconReady ? (
          <div className="flex h-full w-full items-center justify-center bg-muted/40 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading map…
          </div>
        ) : (
          <MapContainer
            center={center}
            zoom={hasPin ? 14 : DEFAULT_ZOOM}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickLayer onPick={onChange} />
            {hasPin && (
              <Marker
                position={[latitude!, longitude!]}
                draggable
                eventHandlers={{
                  dragend(e) {
                    const m = e.target as { getLatLng: () => { lat: number; lng: number } };
                    const { lat, lng } = m.getLatLng();
                    onChange(lat, lng);
                  },
                }}
              />
            )}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
