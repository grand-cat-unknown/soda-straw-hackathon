from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

tool_name = "search"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])


class SearchRequest(BaseModel):
    query: str
    filters: dict[str, Any] | None = None
    location: str | None = None
    time_range: str | None = None


class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    source: str
    timestamp: str


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]


capabilities = [
    {
        "id": "search.web",
        "tool": "search",
        "name": "Web Search",
        "description": "Search the web or connected sources, returns result cards.",
        "method": "POST",
        "endpoint": "/search/web",
        "input_model": "SearchRequest",
        "output_model": "SearchResponse",
        "tags": ["discovery", "external"],
    }
]


_SOURCES = ["wikipedia.org", "nytimes.com", "reddit.com", "lonelyplanet.com", "yelp.com"]


@router.post("/web", response_model=SearchResponse)
def web_search(payload: SearchRequest):
    now = datetime.now(timezone.utc).isoformat()
    suffix = f" near {payload.location}" if payload.location else ""
    results = [
        SearchResult(
            title=f"{payload.query.title()} — overview ({rank})",
            url=f"https://{source}/results?q={payload.query.replace(' ', '+')}&r={rank}",
            snippet=f"Mock result {rank} about '{payload.query}'{suffix}. Source: {source}.",
            source=source,
            timestamp=now,
        )
        for rank, source in enumerate(_SOURCES[:4], start=1)
    ]
    return SearchResponse(query=payload.query, results=results)
