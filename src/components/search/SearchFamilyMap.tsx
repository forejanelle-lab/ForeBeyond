"use client";

import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import type { Map as LeafletMap, LayerGroup, Marker } from "leaflet";
import {
  getInitialMapFocus,
  getListingsMapBounds,
  type ListingMapPoint,
} from "@/lib/listing-map-coords";
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

function popupHtml(point: ListingMapPoint) {
  const location = point.locationLabel ? `<p>${escapeHtml(point.locationLabel)}</p>` : "";
  return `<a href="${point.href}" class="family-map-popup-link">${escapeHtml(point.label)}</a>${location}`;
}

function markerHtml(point: ListingMapPoint) {
  const place = point.locationLabel ? escapeHtml(point.locationLabel) : "";
  return `<div class="family-map-marker">
    <span class="family-map-pin-dot" aria-hidden="true"></span>
    <span class="family-map-pin-card">
      <span class="family-map-pin-name">${escapeHtml(point.label)}</span>
      ${place ? `<span class="family-map-pin-place">${place}</span>` : ""}
    </span>
  </div>`;
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
      const focusPoints = getInitialMapFocus(mapPoints);
      const bounds = getListingsMapBounds(focusPoints);

      if (!mapRef.current) {
        const map = L.map(mapContainerRef.current, {
          scrollWheelZoom: true,
          zoomControl: true,
          minZoom: 4,
          maxBounds: [
            [-48, -180],
            [72, 180],
          ],
          maxBoundsViscosity: 0.7,
          worldCopyJump: true,
        });

        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
            maxZoom: 19,
          }
        ).addTo(map);
        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: "",
            maxZoom: 19,
          }
        ).addTo(map);
        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: "",
            maxZoom: 19,
          }
        ).addTo(map);

        mapRef.current = map;
        markersLayerRef.current = L.layerGroup().addTo(map);
      }

      const map = mapRef.current;
      const markersLayer = markersLayerRef.current;
      if (!map || !markersLayer) return;

      markerRefsRef.current.forEach((marker) => marker.remove());
      markerRefsRef.current = [];
      markersLayer.clearLayers();

      for (const point of mapPoints) {
        const pinIcon = L.divIcon({
          className: "family-map-pin",
          html: markerHtml(point),
          iconSize: [220, 52],
          iconAnchor: [10, 24],
          popupAnchor: [0, -24],
        });
        const marker = L.marker([point.lat, point.lng], { icon: pinIcon, title: point.label });
        marker.bindPopup(popupHtml(point), { closeButton: true, maxWidth: 240 });
        marker.addTo(markersLayer);
        markerRefsRef.current.push(marker);
      }

      if (focusPoints.length === 1) {
        map.setView([focusPoints[0].lat, focusPoints[0].lng], 10);
      } else if (bounds) {
        map.fitBounds(
          [
            [bounds.minLat, bounds.minLng],
            [bounds.maxLat, bounds.maxLng],
          ],
          { padding: [48, 48], maxZoom: 8 }
        );
        if (map.getZoom() < 5) map.setZoom(5);
      }

      const invalidate = () => map.invalidateSize({ animate: false });
      requestAnimationFrame(invalidate);
      window.setTimeout(invalidate, 50);
      window.setTimeout(invalidate, 250);
    });

    return () => {
      cancelled = true;
    };
  }, [mapPoints]);

  useEffect(() => {
    const shell = mapShellRef.current;
    if (!shell) return;

    const observer = new ResizeObserver(() => {
      mapRef.current?.invalidateSize({ animate: false });
    });
    observer.observe(shell);
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

  const hiddenCount = Math.max(0, mapPoints.length - getInitialMapFocus(mapPoints).length);

  return (
    <div
      ref={mapShellRef}
      className="search-family-map relative h-full w-full overflow-hidden rounded-2xl border border-sage-dark/30 shadow-md"
    >
      {mapPoints.length > 0 ? (
        <>
          <div ref={mapContainerRef} className="absolute inset-0 z-0" />
          <div className="pointer-events-none absolute left-3 top-3 z-[500] space-y-2">
            <p className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-charcoal-light shadow-sm">
              {mapPoints.length} {mapPoints.length === 1 ? "host" : "hosts"} on the map
            </p>
            {hiddenCount > 0 ? (
              <p className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-forest shadow-sm">
                Drag the map to see {hiddenCount} more
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 bg-sage/30 p-6 text-center">
          <MapPin className="h-8 w-8 text-forest/40" />
          <p className="text-sm font-medium text-forest">Map view</p>
          <p className="text-xs text-charcoal-light max-w-[16rem]">
            We could not place these hosts on the map yet. Try another destination or check listing
            cities.
          </p>
        </div>
      )}
    </div>
  );
}
