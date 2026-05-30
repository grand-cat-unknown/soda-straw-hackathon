"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapWidget, type MapMarker, type MapRoute } from "@/components/widgets/MapWidget";
import { mapsApi, type Place } from "@/lib/maps";

export default function MapsDemo() {
  const [query, setQuery] = useState("coffee in Brussels");
  const [places, setPlaces] = useState<Place[]>([]);
  const [route, setRoute] = useState<MapRoute | null>(null);
  const [routeInfo, setRouteInfo] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const markers: MapMarker[] = places.map((p) => ({
    id: p.id,
    lng: p.lng,
    lat: p.lat,
    label: `${p.name}\n${p.address}`,
  }));

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { places: hits } = await mapsApi.searchPlaces(query, { limit: 8 });
      setPlaces(hits);
      setRoute(null);
      setRouteInfo("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoute() {
    if (places.length < 2) {
      setError("Need at least two places — search first.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const from = places[0];
      const to = places[places.length - 1];
      const dir = await mapsApi.directions([from.lng, from.lat], [to.lng, to.lat], "walk");
      setRoute({ geometry: dir.geometry });
      setRouteInfo(
        `${from.name} → ${to.name} · ${dir.distance_km.toFixed(2)} km · ${dir.duration_minutes.toFixed(0)} min ${dir.profile}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Route failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-muted px-4 py-10 text-foreground">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Maps widget</h1>
          <p className="text-sm text-muted-foreground">
            Mapbox-backed search + directions, callable programmatically and renderable as a widget.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search</CardTitle>
            <CardDescription>Real Mapbox geocoding via the backend.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex gap-2" onSubmit={handleSearch}>
              <input
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. coffee in Brussels"
              />
              <Button type="submit" disabled={loading}>
                {loading ? "..." : "Search"}
              </Button>
              <Button type="button" variant="outline" onClick={handleRoute} disabled={loading}>
                Walking route (first → last)
              </Button>
            </form>
            {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
            {routeInfo ? <p className="mt-2 text-sm text-muted-foreground">{routeInfo}</p> : null}
          </CardContent>
        </Card>

        <MapWidget markers={markers} route={route} />

        {places.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{places.length} results</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {places.map((p) => (
                  <li key={p.id} className="border-b border-border/50 pb-1 last:border-0">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-muted-foreground">{p.address}</div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </main>
  );
}
