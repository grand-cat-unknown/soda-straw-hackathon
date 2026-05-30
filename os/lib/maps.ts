export type Place = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  city?: string | null;
  neighborhood?: string | null;
  tags?: string[];
};

export type PlacesResponse = { places: Place[] };

export type DirectionsResponse = {
  mode: string;
  profile: string;
  distance_km: number;
  duration_minutes: number;
  geometry: GeoJSON.LineString;
  steps: {
    distance_km: number;
    duration_minutes: number;
    instruction?: string | null;
  }[];
};

export type TravelTimeResponse = {
  duration_minutes: number;
  distance_km: number;
  mode: string;
  profile: string;
};

type Coord = [number, number] | string;

function backendBase(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
}

function apiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_BACKEND_API_KEY;
}

async function call<T>(path: string, body: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const key = apiKey();
  if (key) headers["x-api-key"] = key;

  const response = await fetch(`${backendBase()}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${path} failed (${response.status}): ${text.slice(0, 200)}`);
  }
  return (await response.json()) as T;
}

export const mapsApi = {
  geocode: (query: string, opts?: { proximity?: [number, number]; country?: string; limit?: number }) =>
    call<PlacesResponse>("/maps/geocode", { query, ...opts }),

  searchPlaces: (
    query: string,
    opts?: { near?: string; proximity?: [number, number]; country?: string; limit?: number },
  ) => call<PlacesResponse>("/maps/places/search", { query, ...opts }),

  directions: (origin: Coord, destination: Coord, mode: "walk" | "bike" | "drive" | "transit" = "drive") =>
    call<DirectionsResponse>("/maps/directions", { origin, destination, mode, geometries: "geojson" }),

  travelTime: (origin: Coord, destination: Coord, mode: "walk" | "bike" | "drive" | "transit" = "drive") =>
    call<TravelTimeResponse>("/maps/travel-time", { origin, destination, mode }),
};
