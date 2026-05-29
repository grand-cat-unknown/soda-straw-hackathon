from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

tool_name = "calendar"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])


class CalendarEventCreate(BaseModel):
    title: str
    starts_at: str
    ends_at: str
    location: str | None = None


class CalendarEvent(CalendarEventCreate):
    id: str


class CalendarEventsResponse(BaseModel):
    events: list[CalendarEvent]


events = [
    CalendarEvent(
        id="evt_001",
        title="Hackathon",
        starts_at="2026-05-30T09:00:00+02:00",
        ends_at="2026-05-30T21:00:00+02:00",
        location="Hackathon venue",
    )
]

capabilities = [
    {
        "id": "calendar.list",
        "tool": "calendar",
        "name": "List Calendar Events",
        "description": "Read upcoming calendar events.",
        "method": "GET",
        "endpoint": "/calendar/events",
        "output_model": "CalendarEventsResponse",
        "tags": ["time", "planning"],
    },
    {
        "id": "calendar.create",
        "tool": "calendar",
        "name": "Create Calendar Event",
        "description": "Create a mocked calendar event.",
        "method": "POST",
        "endpoint": "/calendar/events",
        "input_model": "CalendarEventCreate",
        "output_model": "CalendarEvent",
        "tags": ["time", "action"],
    },
]


@router.get("/events", response_model=CalendarEventsResponse)
def list_events():
    return CalendarEventsResponse(events=events)


@router.post("/events", response_model=CalendarEvent, status_code=201)
def create_event(payload: CalendarEventCreate):
    if payload.ends_at <= payload.starts_at:
        raise HTTPException(status_code=400, detail="ends_at must be after starts_at.")

    event = CalendarEvent(id=f"evt_{len(events) + 1:03d}", **payload.model_dump())
    events.append(event)
    return event
