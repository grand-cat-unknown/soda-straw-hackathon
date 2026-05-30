from datetime import date, datetime, time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

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


class AvailabilityContact(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str | None = None
    name: str | None = None
    email: str | None = None


class AvailabilityQuery(BaseModel):
    date: date
    contacts: list[AvailabilityContact] = Field(default_factory=list)
    day_start: str = "09:00"
    day_end: str = "17:00"


class AvailabilitySlot(BaseModel):
    starts_at: str
    ends_at: str


class ContactAvailability(BaseModel):
    contact: AvailabilityContact
    busy: list[CalendarEvent]
    available: list[AvailabilitySlot]
    status: str


class AvailabilityResponse(BaseModel):
    date: date
    availability: list[ContactAvailability]


events: list[CalendarEvent] = [
    CalendarEvent(
        id="evt_001",
        title="Hackathon",
        starts_at="2026-05-30T09:00:00+02:00",
        ends_at="2026-05-30T21:00:00+02:00",
        location="Hackathon venue",
    ),
    CalendarEvent(
        id="evt_002",
        title="Maya design review",
        starts_at="2026-05-31T10:00:00+02:00",
        ends_at="2026-05-31T11:30:00+02:00",
        location="Brussels",
        attendees=["c_001", "Maya Rao"],
    ),
    CalendarEvent(
        id="evt_003",
        title="Leo rehearsal",
        starts_at="2026-05-31T13:00:00+02:00",
        ends_at="2026-05-31T15:00:00+02:00",
        location="Brussels",
        attendees=["c_002", "Leo Martins"],
    ),
    CalendarEvent(
        id="evt_004",
        title="Nina planning block",
        starts_at="2026-05-31T09:00:00+02:00",
        ends_at="2026-05-31T10:00:00+02:00",
        location="Antwerp",
        attendees=["c_005", "Nina Verma"],
    ),
    CalendarEvent(
        id="evt_005",
        title="Tom drinks prep",
        starts_at="2026-05-31T16:00:00+02:00",
        ends_at="2026-05-31T17:00:00+02:00",
        location="Bruges",
        attendees=["c_006", "Tom Jacobs"],
    ),
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
    {
        "id": "calendar.availability",
        "tool": "calendar",
        "name": "Check Contact Availability",
        "description": "Return per-contact availability for a selected day. Pass contacts as selected contact records from the contacts widget.",
        "method": "POST",
        "endpoint": "/calendar/availability",
        "input_model": "AvailabilityQuery",
        "output_model": "AvailabilityResponse",
        "tags": ["time", "planning", "people"],
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


@router.post("/availability", response_model=AvailabilityResponse)
def check_availability(payload: AvailabilityQuery):
    day_start = parse_day_time(payload.day_start, "day_start")
    day_end = parse_day_time(payload.day_end, "day_end")
    if day_end <= day_start:
        raise HTTPException(status_code=400, detail="day_end must be after day_start.")

    if not payload.contacts:
        return AvailabilityResponse(date=payload.date, availability=[])

    day_window_start = datetime.combine(payload.date, day_start)
    day_window_end = datetime.combine(payload.date, day_end)

    availability: list[ContactAvailability] = []
    for contact in payload.contacts:
        busy = busy_events_for_contact(contact, payload.date)
        open_slots = available_slots(day_window_start, day_window_end, busy)
        availability.append(
            ContactAvailability(
                contact=contact,
                busy=busy,
                available=open_slots,
                status=availability_status(busy, open_slots),
            )
        )
    return AvailabilityResponse(date=payload.date, availability=availability)


def availability_status(
    busy: list[CalendarEvent],
    open_slots: list[AvailabilitySlot],
) -> str:
    if busy and open_slots:
        return "partly_busy"
    if busy:
        return "busy"
    return "available"


def parse_day_time(value: str, field_name: str) -> time:
    try:
        return time.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"{field_name} must use HH:MM format.") from exc


def busy_events_for_contact(contact: AvailabilityContact, selected_day: date) -> list[CalendarEvent]:
    keys = {
        item.lower()
        for item in [contact.id, contact.name, contact.email]
        if isinstance(item, str) and item.strip()
    }
    if not keys:
        return []

    return [
        event
        for event in events
        if event_overlaps_day(event, selected_day)
        and keys.intersection(attendee.lower() for attendee in event.attendees)
    ]


def event_overlaps_day(event: CalendarEvent, selected_day: date) -> bool:
    starts_at = datetime.fromisoformat(event.starts_at)
    ends_at = datetime.fromisoformat(event.ends_at)
    return starts_at.date() <= selected_day <= ends_at.date()


def available_slots(
    day_start: datetime,
    day_end: datetime,
    busy_events: list[CalendarEvent],
) -> list[AvailabilitySlot]:
    busy_windows = sorted(
        (
            (
                max(datetime.fromisoformat(event.starts_at).replace(tzinfo=None), day_start),
                min(datetime.fromisoformat(event.ends_at).replace(tzinfo=None), day_end),
            )
            for event in busy_events
        ),
        key=lambda window: window[0],
    )

    slots: list[AvailabilitySlot] = []
    cursor = day_start
    for starts_at, ends_at in busy_windows:
        if ends_at <= cursor:
            continue
        if starts_at > cursor:
            slots.append(render_slot(cursor, starts_at))
        cursor = max(cursor, ends_at)

    if cursor < day_end:
        slots.append(render_slot(cursor, day_end))
    return slots


def render_slot(starts_at: datetime, ends_at: datetime) -> AvailabilitySlot:
    return AvailabilitySlot(
        starts_at=starts_at.isoformat(timespec="minutes"),
        ends_at=ends_at.isoformat(timespec="minutes"),
    )
