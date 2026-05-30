from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

tool_name = "notes"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class NoteCreate(BaseModel):
    title: str
    body: str
    type: str | None = None
    linked_intent_id: str | None = None
    linked_entities: list[str] = Field(default_factory=list)


class NoteUpdate(BaseModel):
    title: str | None = None
    body: str | None = None
    type: str | None = None
    linked_intent_id: str | None = None
    linked_entities: list[str] | None = None


class NoteAppend(BaseModel):
    body: str


class Note(BaseModel):
    id: str
    title: str
    body: str
    type: str | None = None
    linked_intent_id: str | None = None
    linked_entities: list[str] = Field(default_factory=list)
    created_at: str
    updated_at: str


class NotesResponse(BaseModel):
    notes: list[Note]


notes: list[Note] = [
    Note(
        id="note_001",
        title="Venue assumptions",
        body="Apartment fits ~20 people. Limit invites accordingly.",
        type="assumption",
        created_at="2026-05-28T10:00:00+00:00",
        updated_at="2026-05-28T10:00:00+00:00",
    )
]


capabilities = [
    {
        "id": "notes.list",
        "tool": "notes",
        "name": "List Notes",
        "description": "List all notes.",
        "method": "GET",
        "endpoint": "/notes",
        "output_model": "NotesResponse",
        "tags": ["memory"],
    },
    {
        "id": "notes.create",
        "tool": "notes",
        "name": "Create Note",
        "description": "Create a freeform note (brief, decision, assumption, preference, summary).",
        "method": "POST",
        "endpoint": "/notes",
        "input_model": "NoteCreate",
        "output_model": "Note",
        "tags": ["memory", "action"],
    },
    {
        "id": "notes.get",
        "tool": "notes",
        "name": "Get Note",
        "description": "Read one note by ID.",
        "method": "GET",
        "endpoint": "/notes/{note_id}",
        "output_model": "Note",
        "tags": ["memory"],
    },
    {
        "id": "notes.update",
        "tool": "notes",
        "name": "Update Note",
        "description": "Update title, body, type, or links on a note.",
        "method": "PATCH",
        "endpoint": "/notes/{note_id}",
        "input_model": "NoteUpdate",
        "output_model": "Note",
        "tags": ["memory", "action"],
    },
    {
        "id": "notes.append",
        "tool": "notes",
        "name": "Append To Note",
        "description": "Append text to a note's body.",
        "method": "POST",
        "endpoint": "/notes/{note_id}/append",
        "input_model": "NoteAppend",
        "output_model": "Note",
        "tags": ["memory", "action"],
    },
]


def _find(note_id: str) -> tuple[int, Note]:
    for index, note in enumerate(notes):
        if note.id == note_id:
            return index, note
    raise HTTPException(status_code=404, detail=f"Note {note_id} not found.")


@router.get("", response_model=NotesResponse)
def list_notes():
    return NotesResponse(notes=notes)


@router.post("", response_model=Note, status_code=201)
def create_note(payload: NoteCreate):
    now = _now()
    note = Note(id=f"note_{len(notes) + 1:03d}", created_at=now, updated_at=now, **payload.model_dump())
    notes.append(note)
    return note


@router.get("/{note_id}", response_model=Note)
def get_note(note_id: str):
    return _find(note_id)[1]


@router.patch("/{note_id}", response_model=Note)
def update_note(note_id: str, payload: NoteUpdate):
    index, note = _find(note_id)
    updated = note.model_copy(update={**payload.model_dump(exclude_unset=True), "updated_at": _now()})
    notes[index] = updated
    return updated


@router.post("/{note_id}/append", response_model=Note)
def append_note(note_id: str, payload: NoteAppend):
    index, note = _find(note_id)
    updated = note.model_copy(update={"body": f"{note.body}\n{payload.body}", "updated_at": _now()})
    notes[index] = updated
    return updated
