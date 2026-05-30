import math
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

tool_name = "maps"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])


class Place(BaseModel):
    id: str
    name: str
    address: str
    lat: float
    lng: float
    city: str
    neighborhood: str | None = None
    tags: list[str] = Field(default_factory=list)


class PlaceSearchRequest(BaseModel):
    query: str
    near: str | None = None
    filters: dict[str, Any] | None = None


class PlacesResponse(BaseModel):
    places: list[Place]


class TravelTimeRequest(BaseModel):
    origin: str  # place_id or freeform
    destination: str
    mode: str  # walk | bike | drive | transit
    departure_time: str | None = None


class TravelTimeResponse(BaseModel):
    duration_minutes: float
    distance_km: float
    mode: str


class ClusterRequest(BaseModel):
    place_ids: list[str]
    constraints: dict[str, Any] | None = None


class Cluster(BaseModel):
    key: str
    place_ids: list[str]


class ClusterResponse(BaseModel):
    clusters: list[Cluster]


places: list[Place] = [
    Place(id="place_001", name="Café Belga", address="Place Eugène Flagey 18", lat=50.8276, lng=4.3717, city="Brussels", neighborhood="Ixelles", tags=["cafe", "drinks"]),
    Place(id="place_002", name="Brasserie Surrealiste", address="Rue de Flandre 80", lat=50.8530, lng=4.3450, city="Brussels", neighborhood="Sainte-Catherine", tags=["restaurant", "dinner"]),
    Place(id="place_003", name="Bar du Matin", address="Chaussée d'Alsemberg 172", lat=50.8240, lng=4.3450, city="Brussels", neighborhood="Saint-Gilles", tags=["bar", "drinks"]),
    Place(id="place_004", name="Parc du Cinquantenaire", address="Av. de l'Yser 7", lat=50.8403, lng=4.3920, city="Brussels", neighborhood="Etterbeek", tags=["park", "outdoor"]),
    Place(id="place_005", name="Vrijdagmarkt", address="Vrijdagmarkt 1", lat=51.0570, lng=3.7270, city="Ghent", neighborhood="Centrum", tags=["square", "outdoor"]),
    Place(id="place_006", name="DOK Gent", address="Oktrooiplein", lat=51.0660, lng=3.7400, city="Ghent", neighborhood="Dampoort", tags=["bar", "outdoor"]),
    Place(id="place_007", name="Grote Markt Antwerpen", address="Grote Markt", lat=51.2210, lng=4.3990, city="Antwerp", neighborhood="Oude Stad", tags=["square"]),
    Place(id="place_008", name="Café d'Anvers", address="Verversrui 15", lat=51.2255, lng=4.4020, city="Antwerp", neighborhood="Oude Stad", tags=["club", "drinks"]),
]


_MODE_KMH = {"walk": 5.0, "bike": 15.0, "drive": 30.0, "transit": 20.0}


capabilities = [
    {
        "id": "maps.search_places",
        "tool": "maps",
        "name": "Search Places",
        "description": "Search saved places by query, city, or tag.",
        "method": "POST",
        "endpoint": "/maps/places/search",
        "input_model": "PlaceSearchRequest",
        "output_model": "PlacesResponse",
        "tags": ["places", "discovery"],
    },
    {
        "id": "maps.get_place",
        "tool": "maps",
        "name": "Get Place",
        "description": "Fetch a single place by ID.",
        "method": "GET",
        "endpoint": "/maps/places/{place_id}",
        "output_model": "Place",
        "tags": ["places"],
    },
    {
        "id": "maps.estimate_travel_time",
        "tool": "maps",
        "name": "Estimate Travel Time",
        "description": "Estimate distance and duration between two places.",
        "method": "POST",
        "endpoint": "/maps/travel-time",
        "input_model": "TravelTimeRequest",
        "output_model": "TravelTimeResponse",
        "tags": ["places", "planning"],
    },
    {
        "id": "maps.cluster_places",
        "tool": "maps",
        "name": "Cluster Places",
        "description": "Cluster a set of places by neighborhood.",
        "method": "POST",
        "endpoint": "/maps/cluster",
        "input_model": "ClusterRequest",
        "output_model": "ClusterResponse",
        "tags": ["places", "planning"],
    },
]


def _find_place(place_id: str) -> Place:
    for place in places:
        if place.id == place_id:
            return place
    raise HTTPException(status_code=404, detail=f"Place {place_id} not found.")


def _haversine_km(a: Place, b: Place) -> float:
    r = 6371.0
    lat1, lat2 = math.radians(a.lat), math.radians(b.lat)
    dlat = lat2 - lat1
    dlng = math.radians(b.lng - a.lng)
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


@router.post("/places/search", response_model=PlacesResponse)
def search_places(payload: PlaceSearchRequest):
    q = payload.query.lower()
    matches = [
        place
        for place in places
        if q in " ".join([place.name, place.address, place.city, place.neighborhood or "", *place.tags]).lower()
    ]
    if payload.near:
        near = payload.near.lower()
        matches = [p for p in matches if near in p.city.lower() or near in (p.neighborhood or "").lower()]
    return PlacesResponse(places=matches)


@router.get("/places/{place_id}", response_model=Place)
def get_place(place_id: str):
    return _find_place(place_id)


@router.post("/travel-time", response_model=TravelTimeResponse)
def estimate_travel_time(payload: TravelTimeRequest):
    if payload.mode not in _MODE_KMH:
        raise HTTPException(status_code=400, detail=f"Unsupported mode {payload.mode}. Use walk|bike|drive|transit.")

    origin = _find_place(payload.origin) if payload.origin.startswith("place_") else places[0]
    dest = _find_place(payload.destination) if payload.destination.startswith("place_") else places[-1]
    distance = _haversine_km(origin, dest)
    duration = (distance / _MODE_KMH[payload.mode]) * 60.0
    return TravelTimeResponse(
        duration_minutes=round(duration, 1),
        distance_km=round(distance, 2),
        mode=payload.mode,
    )


@router.post("/cluster", response_model=ClusterResponse)
def cluster_places(payload: ClusterRequest):
    buckets: dict[str, list[str]] = {}
    for place_id in payload.place_ids:
        place = _find_place(place_id)
        key = place.neighborhood or place.city
        buckets.setdefault(key, []).append(place_id)
    return ClusterResponse(clusters=[Cluster(key=key, place_ids=ids) for key, ids in buckets.items()])
