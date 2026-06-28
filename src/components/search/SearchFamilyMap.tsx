"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import type { Map as LeafletMap, LayerGroup, Marker } from "leaflet";
import { getListingsMapBounds, type ListingMapPoint } from "@/lib/listing-map-coords";
import "leaflet/dist/leaflet.css";

interface SearchFamilyMapProps {
  mapPoints: ListingMapPoint[];
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function SearchFamilyMap({ mapPoints }: SearchFamilyMapProps) {
  const mapShellRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersLayerRef = useRef<LayerGroup | null>(null);
  const markerRefsRef = useRef<Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapPoints.length === 0) return;

    let cancelled = false;

    void import("leaflet").then((leafletModule) => {
      if (cancelled || !mapContainerRef.current) return;

      const L = leafletModule.default;
      const bounds = getListingsMapBounds(mapPoints);

      if (!mapRef.current) {
        const map = L.map(mapContainerRef.current, {
          scrollWheelZoom: true,
          zoomControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;
        markersLayerRef.current = L.layerGroup().addTo(map);
      }

      const map = mapRef.current;
      const markersLayer = markersLayerRef.current;
      if (!map || !markersLayer) return;

      markerRefsRef.current.forEach((marker) => marker.remove());
      markerRefsRef.current = [];
      markersLayer.clearLayers();

      const pinIcon = L.divIcon({
        className: "family-map-pin",
        html: `<span class="family-map-pin-dot" aria-hidden="true"></span>`,
        iconSize: [20, 20],
        iconAnchor: [10, 20],
        popupAnchor: [0, -22],
      });

      const latLngs: [number, number][] = [];

      for (const point of mapPoints) {
        latLngs.push([point.lat, point.lng]);
        const marker = L.marker([point.lat, point.lng], { icon: pinIcon });
        marker.bindPopup(
          `<a href="${point.href}" class="family-map-popup-link">${escapeHtml(point.label)}</a>`,
          { closeButton: true }
        );
        marker.addTo(markersLayer);
        markerRefsRef.current.push(marker);
      }

      if (latLngs.length === 1) {
        map.setView(latLngs[0], 11);
      } else if (bounds) {
        map.fitBounds(
          [
            [bounds.minLat, bounds.minLng],
            [bounds.maxLat, bounds.maxLng],
          ],
          { padding: [28, 28] }
        );
      }

      const invalidate = () => map.invalidateSize();
      requestAnimationFrame(invalidate);
      window.setTimeout(invalidate, 100);
      window.setTimeout(invalidate, 350);
    });

    return () => {
      cancelled = true;
    };
  }, [mapPoints]);

  useEffect(() => {
    const target = mapShellRef.current ?? mapContainerRef.current;
    if (!target || !mapRef.current) return;

    const observer = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [mapPoints.length]);

  useEffect(() => {
    return () => {
      markerRefsRef.current.forEach((marker) => marker.remove());
      markerRefsRef.current = [];
      markersLayerRef.current?.clearLayers();
      mapRef.current?.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  return (
    <div
      ref={mapShellRef}
      className="search-family-map relative flex h-full min-h-[420px] w-full flex-col overflow-hidden rounded-2xl border border-sage-dark/30 shadow-md"
    >
      {mapPoints.length > 0 ? (
        <>
          <div className="relative min-h-0 flex-1">
            <div ref={mapContainerRef} className="absolute inset-0 z-0" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] bg-gradient-to-b from-white/95 via-white/75 to-transparent p-3 pb-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-light">
                {mapPoints.length} families on map
              </p>
            </div>
          </div>
          <div className="z-[500] max-h-36 shrink-0 overflow-y-auto border-t border-sage-dark/20 bg-white/95 p-3">
            <ul className="space-y-1.5">
              {mapPoints.slice(0, 8).map((point) => (
                <li key={point.id}>
                  <Link
                    href={point.href}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-forest hover:bg-sage/50 transition-colors"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{point.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="flex min-h-[420px] flex-1 flex-col items-center justify-center gap-2 bg-sage/30 p-6 text-center">
          <MapPin className="h-8 w-8 text-forest/40" />
          <p className="text-sm font-medium text-forest">Map view</p>
          <p className="text-xs text-charcoal-light max-w-[14rem]">
            Add location details to listings or adjust filters to see families on the map.
          </p>
        </div>
      )}
    </div>
  );
}
