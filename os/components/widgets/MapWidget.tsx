"use client";

import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Place, Route, WidgetComponentProps } from "@/lib/workspace";

export type MapWidgetProps = {
  center?: [number, number];
  zoom?: number;
  markers?: Place[];
  route?: Route | null;
  style?: string;
  fitToContent?: boolean;
  className?: string;
  onMarkerClick?: (marker: Place) => void;
};

export function MapCanvasWidget({ input, emitOutput }: WidgetComponentProps) {
  const markers = (input.markers as Place[] | undefined) ?? [];
  const markersKey = useMemo(() => JSON.stringify(markers), [markers]);
  const emittedMarkersKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (emittedMarkersKeyRef.current === markersKey) return;
    emittedMarkersKeyRef.current = markersKey;
    emitOutput("availableMarkers", markers);
  }, [emitOutput, markersKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      <MapWidget
        markers={markers}
        route={(input.route as Route | null | undefined) ?? null}
        className="h-[360px]"
        onMarkerClick={(marker) => emitOutput("selectedMarker", marker)}
      />
      {markers.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {markers.map((marker) => (
            <Button
              key={marker.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => emitOutput("selectedMarker", marker)}
            >
              {marker.label ?? marker.id}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const DEFAULT_STYLE = "mapbox://styles/mapbox/streets-v12";
const DEFAULT_CENTER: [number, number] = [4.3517, 50.8503];
const DEFAULT_ZOOM = 11;

export function MapWidget({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  markers = [],
  route = null,
  style = DEFAULT_STYLE,
  fitToContent = true,
  className,
  onMarkerClick,
}: MapWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerObjsRef = useRef<mapboxgl.Marker[]>([]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Stable string keys so effects don't churn on every render when arrays are
  // freshly constructed but semantically unchanged.
  const markersKey = useMemo(
    () => JSON.stringify(markers.map((m) => [m.id, m.lng, m.lat, m.label, m.color])),
    [markers],
  );
  const routeKey = useMemo(() => (route ? JSON.stringify(route.geometry) : ""), [route]);

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style,
      center,
      zoom,
    });
    mapRef.current = map;

    return () => {
      markerObjsRef.current.forEach((m) => m.remove());
      markerObjsRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [token, style]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerObjsRef.current.forEach((m) => m.remove());
    markerObjsRef.current = [];

    markers.forEach((m) => {
      const el = new mapboxgl.Marker({ color: m.color ?? "#2563eb" })
        .setLngLat([m.lng, m.lat])
        .addTo(map);
      if (m.label) {
        el.setPopup(new mapboxgl.Popup({ offset: 16 }).setText(m.label));
      }
      if (onMarkerClick) {
        el.getElement().addEventListener("click", () => onMarkerClick(m));
      }
      markerObjsRef.current.push(el);
    });
  }, [markersKey, onMarkerClick]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      const sourceId = "fluid-os-route";
      const layerId = "fluid-os-route-line";

      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      if (!route) return;

      map.addSource(sourceId, {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: route.geometry },
      });
      map.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": route.color ?? "#2563eb",
          "line-width": 4,
          "line-opacity": 0.85,
        },
      });
    };

    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [routeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fitToContent) return;

    const coords: [number, number][] = [];
    markers.forEach((m) => coords.push([m.lng, m.lat]));
    if (route?.geometry?.coordinates) {
      route.geometry.coordinates.forEach((c) => coords.push([c[0], c[1]]));
    }

    if (coords.length === 0) return;
    if (coords.length === 1) {
      map.easeTo({ center: coords[0], zoom: Math.max(map.getZoom(), 13) });
      return;
    }

    const bounds = coords.reduce(
      (b, c) => b.extend(c),
      new mapboxgl.LngLatBounds(coords[0], coords[0]),
    );
    map.fitBounds(bounds, { padding: 48, duration: 600 });
  }, [markersKey, routeKey, fitToContent]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!token) {
    return (
      <div
        className={cn(
          "flex h-[420px] items-center justify-center rounded-lg border border-dashed border-border bg-muted text-sm text-muted-foreground",
          className,
        )}
      >
        Set NEXT_PUBLIC_MAPBOX_TOKEN in os/.env to enable the map.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("h-[420px] w-full overflow-hidden rounded-lg border border-border", className)}
    />
  );
}
