import os
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

tool_name = "search"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])

EXA_API_URL = "https://api.exa.ai/search"


class SearchRequest(BaseModel):
    query: str
    num_results: int = 5
    type: str | None = None  # "neural" | "keyword" | "auto"
    category: str | None = None  # e.g. "company", "research paper", "news"
    include_domains: list[str] | None = None
    exclude_domains: list[str] | None = None
    start_published_date: str | None = None
    end_published_date: str | None = None
    include_text: bool = False


class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    source: str
    published_date: str | None = None
    author: str | None = None
    score: float | None = None
    text: str | None = None


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]


capabilities = [
    {
        "id": "search.web",
        "tool": "search",
        "name": "Web Search",
        "description": "Real web search via Exa. Returns ranked result cards with title, url, snippet, source, and optional full text.",
        "method": "POST",
        "endpoint": "/search/web",
        "input_model": "SearchRequest",
        "output_model": "SearchResponse",
        "tags": ["discovery", "external"],
    }
]


def _source_from_url(url: str) -> str:
    try:
        host = httpx.URL(url).host or url
        return host[4:] if host.startswith("www.") else host
    except Exception:
        return url


def _build_payload(payload: SearchRequest) -> dict[str, Any]:
    body: dict[str, Any] = {
        "query": payload.query,
        "numResults": max(1, min(payload.num_results, 25)),
        "contents": {
            "text": payload.include_text,
            "highlights": {"numSentences": 2, "highlightsPerUrl": 1},
        },
    }
    if payload.type:
        body["type"] = payload.type
    if payload.category:
        body["category"] = payload.category
    if payload.include_domains:
        body["includeDomains"] = payload.include_domains
    if payload.exclude_domains:
        body["excludeDomains"] = payload.exclude_domains
    if payload.start_published_date:
        body["startPublishedDate"] = payload.start_published_date
    if payload.end_published_date:
        body["endPublishedDate"] = payload.end_published_date
    return body


@router.post("/web", response_model=SearchResponse)
def web_search(payload: SearchRequest):
    api_key = os.getenv("EXA_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="EXA_API_KEY is not configured on the server.")

    try:
        response = httpx.post(
            EXA_API_URL,
            headers={"x-api-key": api_key, "Content-Type": "application/json"},
            json=_build_payload(payload),
            timeout=30.0,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Exa request failed: {exc}") from exc

    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"Exa returned {response.status_code}: {response.text[:300]}",
        )

    data = response.json()
    results: list[SearchResult] = []
    for item in data.get("results", []):
        highlights = item.get("highlights") or []
        text = item.get("text")
        snippet = " ".join(highlights).strip() if highlights else (text or "")[:280]
        url = item.get("url", "")
        results.append(
            SearchResult(
                title=item.get("title") or url or "(untitled)",
                url=url,
                snippet=snippet or "(no snippet)",
                source=_source_from_url(url),
                published_date=item.get("publishedDate"),
                author=item.get("author"),
                score=item.get("score"),
                text=text if payload.include_text else None,
            )
        )

    return SearchResponse(query=payload.query, results=results)
