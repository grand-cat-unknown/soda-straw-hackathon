from fastapi import APIRouter
from pydantic import BaseModel

tool_name = "messages"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])


class MessageDraftRequest(BaseModel):
    event_name: str = "Housewarming"
    date: str = "next Saturday"
    tone: str = "warm"
    host: str = "Srikanth"


class MessageDraftResponse(BaseModel):
    subject: str
    tone: str
    body: str


capabilities = [
    {
        "id": "messages.draft",
        "tool": "messages",
        "name": "Draft Message",
        "description": "Create a draft invite or follow-up message.",
        "method": "POST",
        "endpoint": "/messages/draft",
        "input_model": "MessageDraftRequest",
        "output_model": "MessageDraftResponse",
        "tags": ["communication", "party"],
    }
]


@router.post("/draft", response_model=MessageDraftResponse)
def draft_message(payload: MessageDraftRequest):
    return MessageDraftResponse(
        subject=f"{payload.event_name} invite",
        tone=payload.tone,
        body=(
            f"Hey! {payload.host} is planning a {payload.event_name.lower()} on "
            f"{payload.date}. Would love to have you there. More details soon."
        ),
    )
