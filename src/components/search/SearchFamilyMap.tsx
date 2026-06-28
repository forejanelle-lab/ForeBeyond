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
          { padding: [36, 36] }
        );
      }

      requestAnimationFrame(() => {
        map.invalidateSize();
      });
    });

    return () => {
      cancelled = true;
    };
  }, [mapPoints]);

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
    <div className="relative sticky top-24 h-[min(70vh,640px)] min-h-[320px] w-full overflow-hidden rounded-2xl border border-sage-dark/30 bg-sage shadow-md">
      {mapPoints.length > 0 ? (
        <>
          <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />
          <div className="absolute inset-x-0 bottom-0 z-[500] max-h-[45%] overflow-y-auto bg-gradient-to-t from-white via-white/95 to-transparent p-3 pt-8 pointer-events-none">
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-light mb-2">
              {mapPoints.length} on map
            </p>
            <ul className="space-y-1.5 pointer-events-auto">
              {mapPoints.slice(0, 8).map((point) => (
                <li key={point.id}>
                  <Link
                    href={point.href}
                    className="flex items-center gap-2 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-forest shadow-sm hover:bg-sage/40 transition-colors"
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
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
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
