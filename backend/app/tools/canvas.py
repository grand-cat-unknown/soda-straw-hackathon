from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

tool_name = "canvas"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])


_LAYOUTS = {"dashboard", "board", "timeline", "map", "checklist", "table", "comparison", "calendar"}


class DataSourceRef(BaseModel):
    tool: str
    capability_id: str
    params: dict[str, Any] | None = None


class ActionSpec(BaseModel):
    label: str
    capability_id: str
    params: dict[str, Any] | None = None


class CanvasRender(BaseModel):
    title: str
    layout: str
    data_sources: list[DataSourceRef] = Field(default_factory=list)
    actions: list[ActionSpec] = Field(default_factory=list)
    linked_intent_id: str | None = None


class Canvas(BaseModel):
    id: str
    title: str
    layout: str
    data_sources: list[DataSourceRef]
    actions: list[ActionSpec]
    linked_intent_id: str | None = None
    created_at: str


class CanvasesResponse(BaseModel):
    canvases: list[Canvas]


canvases: list[Canvas] = []


capabilities = [
    {
        "id": "canvas.render",
        "tool": "canvas",
        "name": "Render Canvas",
        "description": "Create a temporary view (dashboard, board, timeline, map, checklist, table, comparison, calendar) over data sources.",
        "method": "POST",
        "endpoint": "/canvas/render",
        "input_model": "CanvasRender",
        "output_model": "Canvas",
        "tags": ["interface", "action"],
    },
    {
        "id": "canvas.list",
        "tool": "canvas",
        "name": "List Canvases",
        "description": "List all rendered canvases.",
        "method": "GET",
        "endpoint": "/canvas",
        "output_model": "CanvasesResponse",
        "tags": ["interface"],
    },
    {
        "id": "canvas.get",
        "tool": "canvas",
        "name": "Get Canvas",
        "description": "Fetch a single canvas spec by ID.",
        "method": "GET",
        "endpoint": "/canvas/{canvas_id}",
        "output_model": "Canvas",
        "tags": ["interface"],
    },
    {
        "id": "canvas.delete",
        "tool": "canvas",
        "name": "Delete Canvas",
        "description": "Discard a canvas.",
        "method": "DELETE",
        "endpoint": "/canvas/{canvas_id}",
        "tags": ["interface", "action"],
    },
]


def _find(canvas_id: str) -> tuple[int, Canvas]:
    for index, canvas in enumerate(canvases):
        if canvas.id == canvas_id:
            return index, canvas
    raise HTTPException(status_code=404, detail=f"Canvas {canvas_id} not found.")


@router.post("/render", response_model=Canvas, status_code=201)
def render_canvas(payload: CanvasRender):
    if payload.layout not in _LAYOUTS:
        raise HTTPException(status_code=400, detail=f"Unsupported layout {payload.layout}. Use one of {sorted(_LAYOUTS)}.")

    canvas = Canvas(
        id=f"cvs_{len(canvases) + 1:03d}",
        created_at=datetime.now(timezone.utc).isoformat(),
        **payload.model_dump(),
    )
    canvases.append(canvas)
    return canvas


@router.get("", response_model=CanvasesResponse)
def list_canvases():
    return CanvasesResponse(canvases=canvases)


@router.get("/{canvas_id}", response_model=Canvas)
def get_canvas(canvas_id: str):
    return _find(canvas_id)[1]


@router.delete("/{canvas_id}", status_code=204)
def delete_canvas(canvas_id: str):
    index, _ = _find(canvas_id)
    canvases.pop(index)
    return None
