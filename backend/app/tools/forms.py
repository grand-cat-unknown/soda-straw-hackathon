from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

tool_name = "forms"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class FieldSpec(BaseModel):
    name: str
    type: str  # text | number | date | select | checkbox
    required: bool = False
    options: list[str] | None = None


class FormCreate(BaseModel):
    title: str
    fields: list[FieldSpec]
    destination: str | None = None  # e.g. "tables:tbl_001" or "contacts"


class Form(BaseModel):
    id: str
    title: str
    fields: list[FieldSpec]
    destination: str | None = None
    share_url: str


class FormResponseSubmit(BaseModel):
    values: dict[str, Any]


class FormResponseRecord(BaseModel):
    id: str
    form_id: str
    values: dict[str, Any]
    submitted_at: str


class FormsResponse(BaseModel):
    forms: list[Form]


class FormResponsesResponse(BaseModel):
    form_id: str
    responses: list[FormResponseRecord]


forms: list[Form] = []
responses: list[FormResponseRecord] = []


capabilities = [
    {
        "id": "forms.create",
        "tool": "forms",
        "name": "Create Form",
        "description": "Create a form with typed fields and an optional destination.",
        "method": "POST",
        "endpoint": "/forms",
        "input_model": "FormCreate",
        "output_model": "Form",
        "tags": ["input", "action"],
    },
    {
        "id": "forms.list",
        "tool": "forms",
        "name": "List Forms",
        "description": "List all forms.",
        "method": "GET",
        "endpoint": "/forms",
        "output_model": "FormsResponse",
        "tags": ["input"],
    },
    {
        "id": "forms.get",
        "tool": "forms",
        "name": "Get Form",
        "description": "Fetch a single form by ID.",
        "method": "GET",
        "endpoint": "/forms/{form_id}",
        "output_model": "Form",
        "tags": ["input"],
    },
    {
        "id": "forms.submit_response",
        "tool": "forms",
        "name": "Submit Form Response",
        "description": "Submit a response to a form.",
        "method": "POST",
        "endpoint": "/forms/{form_id}/responses",
        "input_model": "FormResponseSubmit",
        "output_model": "FormResponseRecord",
        "tags": ["input", "action"],
    },
    {
        "id": "forms.list_responses",
        "tool": "forms",
        "name": "List Form Responses",
        "description": "List collected responses for a form.",
        "method": "GET",
        "endpoint": "/forms/{form_id}/responses",
        "output_model": "FormResponsesResponse",
        "tags": ["input"],
    },
]


def _find_form(form_id: str) -> Form:
    for form in forms:
        if form.id == form_id:
            return form
    raise HTTPException(status_code=404, detail=f"Form {form_id} not found.")


@router.post("", response_model=Form, status_code=201)
def create_form(payload: FormCreate):
    form_id = f"form_{len(forms) + 1:03d}"
    form = Form(
        id=form_id,
        title=payload.title,
        fields=payload.fields,
        destination=payload.destination,
        share_url=f"/forms/{form_id}/respond",
    )
    forms.append(form)
    return form


@router.get("", response_model=FormsResponse)
def list_forms():
    return FormsResponse(forms=forms)


@router.get("/{form_id}", response_model=Form)
def get_form(form_id: str):
    return _find_form(form_id)


@router.post("/{form_id}/responses", response_model=FormResponseRecord, status_code=201)
def submit_response(form_id: str, payload: FormResponseSubmit):
    form = _find_form(form_id)
    missing = [field.name for field in form.fields if field.required and field.name not in payload.values]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required fields: {missing}")

    record = FormResponseRecord(
        id=f"resp_{len(responses) + 1:03d}",
        form_id=form_id,
        values=payload.values,
        submitted_at=_now(),
    )
    responses.append(record)
    return record


@router.get("/{form_id}/responses", response_model=FormResponsesResponse)
def list_responses(form_id: str):
    _find_form(form_id)
    return FormResponsesResponse(form_id=form_id, responses=[r for r in responses if r.form_id == form_id])
