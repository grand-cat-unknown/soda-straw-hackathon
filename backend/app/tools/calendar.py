from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

tool_name = "calendar"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])


class CalendarEventCreate(BaseModel):
    title: str
    starts_at: str
    ends_at: str
    location: str | None = None
    attendees: list[str] = Field(default_factory=list)
    linked_intent_id: str | None = None


class CalendarEvent(CalendarEventCreate):
    id: str


class CalendarEventsResponse(BaseModel):
    events: list[CalendarEvent]


class ReminderCreate(BaseModel):
    title: str
    remind_at: str
    linked_intent_id: str | None = None
    linked_entity: str | None = None


class Reminder(ReminderCreate):
    id: str


class RemindersResponse(BaseModel):
    reminders: list[Reminder]


class ConflictQuery(BaseModel):
    starts_at: str
    ends_at: str
    people: list[str] | None = None


class ConflictResponse(BaseModel):
    conflicts: list[CalendarEvent]


events: list[CalendarEvent] = [
    CalendarEvent(
        id="evt_001",
        title="Hackathon",
        starts_at="2026-05-30T09:00:00+02:00",
        ends_at="2026-05-30T21:00:00+02:00",
        location="Hackathon venue",
    )
]

reminders: list[Reminder] = []


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
        "description": "Create a calendar event.",
        "method": "POST",
        "endpoint": "/calendar/events",
        "input_model": "CalendarEventCreate",
        "output_model": "CalendarEvent",
        "tags": ["time", "action"],
    },
    {
        "id": "calendar.create_reminder",
        "tool": "calendar",
        "name": "Create Reminder",
        "description": "Create a one-shot reminder for a future moment.",
        "method": "POST",
        "endpoint": "/calendar/reminders",
        "input_model": "ReminderCreate",
        "output_model": "Reminder",
        "tags": ["time", "action"],
    },
    {
        "id": "calendar.list_reminders",
        "tool": "calendar",
        "name": "List Reminders",
        "description": "Read upcoming reminders.",
        "method": "GET",
        "endpoint": "/calendar/reminders",
        "output_model": "RemindersResponse",
        "tags": ["time"],
    },
    {
        "id": "calendar.find_conflicts",
        "tool": "calendar",
        "name": "Find Conflicts",
        "description": "Find events that overlap a given time window.",
        "method": "POST",
        "endpoint": "/calendar/conflicts",
        "input_model": "ConflictQuery",
        "output_model": "ConflictResponse",
        "tags": ["time", "planning"],
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


@router.get("/reminders", response_model=RemindersResponse)
def list_reminders():
    return RemindersResponse(reminders=reminders)


@router.post("/reminders", response_model=Reminder, status_code=201)
def create_reminder(payload: ReminderCreate):
    reminder = Reminder(id=f"rem_{len(reminders) + 1:03d}", **payload.model_dump())
    reminders.append(reminder)
    return reminder


@router.post("/conflicts", response_model=ConflictResponse)
def find_conflicts(payload: ConflictQuery):
    if payload.ends_at <= payload.starts_at:
        raise HTTPException(status_code=400, detail="ends_at must be after starts_at.")

    conflicts = [
        event
        for event in events
        if event.starts_at < payload.ends_at and event.ends_at > payload.starts_at
    ]
    return ConflictResponse(conflicts=conflicts)
