from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

tool_name = "messages"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class MessageDraftRequest(BaseModel):
    recipients: list[str] = Field(default_factory=list)
    channel: str = "email"  # email | sms | slack | whatsapp
    purpose: str = "Reach out"
    tone: str = "warm"
    context: dict[str, Any] | None = None


class MessageDraftResponse(BaseModel):
    id: str
    recipients: list[str]
    channel: str
    tone: str
    subject: str
    body: str


class MessageSendRequest(BaseModel):
    draft_id: str


class MessageSendResponse(BaseModel):
    message_id: str
    draft_id: str
    status: str
    sent_at: str


class TrackRepliesRequest(BaseModel):
    response_mapping: dict[str, str] | None = None


class TrackRepliesResponse(BaseModel):
    tracking_id: str
    message_id: str
    replies: list[dict[str, Any]] = Field(default_factory=list)


drafts: list[MessageDraftResponse] = []
sent_messages: list[MessageSendResponse] = []


capabilities = [
    {
        "id": "messages.draft",
        "tool": "messages",
        "name": "Draft Message",
        "description": "Compose a message for one or more recipients across a chosen channel.",
        "method": "POST",
        "endpoint": "/messages/draft",
        "input_model": "MessageDraftRequest",
        "output_model": "MessageDraftResponse",
        "tags": ["communication", "action"],
    },
    {
        "id": "messages.send",
        "tool": "messages",
        "name": "Send Message",
        "description": "Send a previously drafted message.",
        "method": "POST",
        "endpoint": "/messages/send",
        "input_model": "MessageSendRequest",
        "output_model": "MessageSendResponse",
        "tags": ["communication", "action"],
    },
    {
        "id": "messages.track_replies",
        "tool": "messages",
        "name": "Track Replies",
        "description": "Begin tracking replies for a sent message; optional response mapping for structured intake.",
        "method": "POST",
        "endpoint": "/messages/{message_id}/track-replies",
        "input_model": "TrackRepliesRequest",
        "output_model": "TrackRepliesResponse",
        "tags": ["communication"],
    },
]


def _compose_subject(purpose: str) -> str:
    cleaned = purpose.strip().rstrip(".")
    return cleaned[:1].upper() + cleaned[1:] if cleaned else "Hello"


def _compose_body(payload: MessageDraftRequest) -> str:
    context_line = ""
    if payload.context:
        bits = ", ".join(f"{k}: {v}" for k, v in payload.context.items())
        context_line = f"\n\nContext — {bits}."

    salutation = "Hi" if payload.tone in {"warm", "friendly", "casual"} else "Hello"
    audience = ", ".join(payload.recipients) if payload.recipients else "there"
    return f"{salutation} {audience},\n\n{payload.purpose}.{context_line}\n\nThanks."


@router.post("/draft", response_model=MessageDraftResponse)
def draft_message(payload: MessageDraftRequest):
    draft = MessageDraftResponse(
        id=f"draft_{len(drafts) + 1:03d}",
        recipients=payload.recipients,
        channel=payload.channel,
        tone=payload.tone,
        subject=_compose_subject(payload.purpose),
        body=_compose_body(payload),
    )
    drafts.append(draft)
    return draft


@router.post("/send", response_model=MessageSendResponse)
def send_message(payload: MessageSendRequest):
    if not any(draft.id == payload.draft_id for draft in drafts):
        raise HTTPException(status_code=404, detail=f"Draft {payload.draft_id} not found.")

    response = MessageSendResponse(
        message_id=f"msg_{len(sent_messages) + 1:03d}",
        draft_id=payload.draft_id,
        status="sent",
        sent_at=_now(),
    )
    sent_messages.append(response)
    return response


@router.post("/{message_id}/track-replies", response_model=TrackRepliesResponse)
def track_replies(message_id: str, payload: TrackRepliesRequest):
    if not any(msg.message_id == message_id for msg in sent_messages):
        raise HTTPException(status_code=404, detail=f"Message {message_id} not found.")

    return TrackRepliesResponse(
        tracking_id=f"trk_{message_id}",
        message_id=message_id,
        replies=[],
    )
