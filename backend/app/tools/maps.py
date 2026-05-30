import os
from typing import Any
from urllib.parse import quote

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

tool_name = "maps"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])

MAPBOX_GEOCODE_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json"
MAPBOX_DIRECTIONS_URL = "https://api.mapbox.com/directions/v5/mapbox/{profile}/{coords}"

_MODE_TO_PROFILE = {
    "walk": "walking",
    "walking": "walking",
    "bike": "cycling",
    "cycling": "cycling",
    "drive": "driving",
    "driving": "driving",
    "transit": "driving",  # Mapbox has no public transit profile; fall back to driving
}


class Place(BaseModel):
    id: str
    name: str
    address: str
    lat: float
    lng: float
    city: str | None = None
    neighborhood: str | None = None
    tags: list[str] = Field(default_factory=list)


class GeocodeRequest(BaseModel):
    query: str
    proximity: list[float] | None = None  # [lng, lat]
    country: str | None = None
    limit: int = 5


class PlaceSearchRequest(BaseModel):
    query: str
    near: str | None = None  # freeform place name; resolved to proximity
    proximity: list[float] | None = None  # [lng, lat] — wins over `near`
    country: str | None = None
    limit: int = 8


class PlacesResponse(BaseModel):
    places: list[Place]


class DirectionsRequest(BaseModel):
    origin: list[float] | str  # [lng, lat] or freeform address
    destination: list[float] | str
    mode: str = "drive"  # walk | bike | drive | transit
    geometries: str = "geojson"  # "geojson" | "polyline"


class RouteStep(BaseModel):
    distance_km: float
    duration_minutes: float
    instruction: str | None = None


class DirectionsResponse(BaseModel):
    mode: str
    profile: str
    distance_km: float
    duration_minutes: float
    geometry: dict[str, Any] | str  # GeoJSON LineString or encoded polyline
    steps: list[RouteStep] = Field(default_factory=list)


class TravelTimeRequest(BaseModel):
    origin: list[float] | str
    destination: list[float] | str
    mode: str = "drive"


class TravelTimeResponse(BaseModel):
    duration_minutes: float
    distance_km: float
    mode: str
    profile: str


capabilities = [
    {
        "id": "maps.geocode",
        "tool": "maps",
        "name": "Geocode Address",
        "description": "Resolve a freeform address or place name to lat/lng using Mapbox.",
        "method": "POST",
        "endpoint": "/maps/geocode",
        "input_model": "GeocodeRequest",
        "output_model": "PlacesResponse",
        "tags": ["places", "geocoding"],
    },
    {
        "id": "maps.search_places",
        "tool": "maps",
        "name": "Search Places",
        "description": "Search real-world places via Mapbox Geocoding with optional proximity bias.",
        "method": "POST",
        "endpoint": "/maps/places/search",
        "input_model": "PlaceSearchRequest",
        "output_model": "PlacesResponse",
        "tags": ["places", "discovery"],
    },
    {
        "id": "maps.directions",
        "tool": "maps",
        "name": "Directions",
        "description": "Real walking/cycling/driving route between two points. Returns GeoJSON geometry the map widget can render directly.",
        "method": "POST",
        "endpoint": "/maps/directions",
        "input_model": "DirectionsRequest",
        "output_model": "DirectionsResponse",
        "tags": ["places", "planning", "routing"],
    },
    {
        "id": "maps.estimate_travel_time",
        "tool": "maps",
        "name": "Estimate Travel Time",
        "description": "Estimate distance and duration between two points using Mapbox Directions.",
        "method": "POST",
        "endpoint": "/maps/travel-time",
        "input_model": "TravelTimeRequest",
        "output_model": "TravelTimeResponse",
        "tags": ["places", "planning"],
    },
]


def _mapbox_token() -> str:
    token = os.getenv("MAPBOX_TOKEN")
    if not token:
        raise HTTPException(status_code=503, detail="MAPBOX_TOKEN is not configured on the server.")
    return token


def _mode_to_profile(mode: str) -> str:
    profile = _MODE_TO_PROFILE.get(mode.lower())
    if not profile:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported mode {mode}. Use walk|bike|drive|transit.",
        )
    return profile


def _coord(point: list[float] | str, *, token: str) -> tuple[float, float]:
    """Normalize a coordinate input to (lng, lat). Geocodes if a string is passed."""
    if isinstance(point, list):
        if len(point) != 2:
            raise HTTPException(status_code=400, detail="Coordinate must be [lng, lat].")
        return float(point[0]), float(point[1])

    features = _geocode(point, token=token, limit=1)
    if not features:
        raise HTTPException(status_code=404, detail=f"Could not geocode '{point}'.")
    place = features[0]
    return place.lng, place.lat


def _feature_to_place(feature: dict[str, Any]) -> Place:
    coords = feature.get("center") or [0.0, 0.0]
    context = {ctx.get("id", "").split(".")[0]: ctx.get("text") for ctx in feature.get("context", [])}
    return Place(
        id=feature.get("id", ""),
        name=feature.get("text") or feature.get("place_name", ""),
        address=feature.get("place_name", ""),
        lat=float(coords[1]),
        lng=float(coords[0]),
        city=context.get("place") or context.get("locality"),
        neighborhood=context.get("neighborhood"),
        tags=list(feature.get("place_type", [])),
    )


def _geocode(
    query: str,
    *,
    token: str,
    proximity: list[float] | None = None,
    country: str | None = None,
    limit: int = 5,
) -> list[Place]:
    params: dict[str, Any] = {
        "access_token": token,
        "limit": max(1, min(limit, 10)),
    }
    if proximity and len(proximity) == 2:
        params["proximity"] = f"{proximity[0]},{proximity[1]}"
    if country:
        params["country"] = country

    url = MAPBOX_GEOCODE_URL.format(query=quote(query, safe=""))
    try:
        response = httpx.get(url, params=params, timeout=15.0)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Mapbox geocoding failed: {exc}") from exc

    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"Mapbox returned {response.status_code}: {response.text[:300]}",
        )

    data = response.json()
    return [_feature_to_place(feat) for feat in data.get("features", [])]


@router.post("/geocode", response_model=PlacesResponse)
def geocode(payload: GeocodeRequest):
    token = _mapbox_token()
    results = _geocode(
        payload.query,
        token=token,
        proximity=payload.proximity,
        country=payload.country,
        limit=payload.limit,
    )
    return PlacesResponse(places=results)


@router.post("/places/search", response_model=PlacesResponse)
def search_places(payload: PlaceSearchRequest):
    token = _mapbox_token()
    proximity = payload.proximity
    if not proximity and payload.near:
        near_hits = _geocode(payload.near, token=token, limit=1)
        if near_hits:
            proximity = [near_hits[0].lng, near_hits[0].lat]

    results = _geocode(
        payload.query,
        token=token,
        proximity=proximity,
        country=payload.country,
        limit=payload.limit,
    )
    return PlacesResponse(places=results)


def _directions(
    origin: list[float] | str,
    destination: list[float] | str,
    mode: str,
    geometries: str,
) -> dict[str, Any]:
    token = _mapbox_token()
    profile = _mode_to_profile(mode)

    o_lng, o_lat = _coord(origin, token=token)
    d_lng, d_lat = _coord(destination, token=token)

    coords = f"{o_lng},{o_lat};{d_lng},{d_lat}"
    url = MAPBOX_DIRECTIONS_URL.format(profile=profile, coords=coords)
    params = {
        "access_token": token,
        "geometries": geometries,
        "overview": "full",
        "steps": "true",
    }

    try:
        response = httpx.get(url, params=params, timeout=20.0)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Mapbox directions failed: {exc}") from exc

    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"Mapbox returned {response.status_code}: {response.text[:300]}",
        )

    data = response.json()
    routes = data.get("routes") or []
    if not routes:
        raise HTTPException(status_code=404, detail="No route found between those points.")

    route = routes[0]
    return {"route": route, "profile": profile}


@router.post("/directions", response_model=DirectionsResponse)
def directions(payload: DirectionsRequest):
    result = _directions(payload.origin, payload.destination, payload.mode, payload.geometries)
    route = result["route"]
    steps: list[RouteStep] = []
    for leg in route.get("legs", []):
        for step in leg.get("steps", []):
            steps.append(
                RouteStep(
                    distance_km=round(step.get("distance", 0) / 1000.0, 3),
                    duration_minutes=round(step.get("duration", 0) / 60.0, 2),
                    instruction=(step.get("maneuver") or {}).get("instruction"),
                )
            )

    return DirectionsResponse(
        mode=payload.mode,
        profile=result["profile"],
        distance_km=round(route.get("distance", 0) / 1000.0, 3),
        duration_minutes=round(route.get("duration", 0) / 60.0, 2),
        geometry=route.get("geometry"),
        steps=steps,
    )


@router.post("/travel-time", response_model=TravelTimeResponse)
def estimate_travel_time(payload: TravelTimeRequest):
    result = _directions(payload.origin, payload.destination, payload.mode, "geojson")
    route = result["route"]
    return TravelTimeResponse(
        duration_minutes=round(route.get("duration", 0) / 60.0, 2),
        distance_km=round(route.get("distance", 0) / 1000.0, 3),
        mode=payload.mode,
        profile=result["profile"],
    )
