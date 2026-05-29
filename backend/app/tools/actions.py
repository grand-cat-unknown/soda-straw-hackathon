from time import time
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

tool_name = "actions"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])


class SimulateActionRequest(BaseModel):
    capability: str = "unknown"
    input: dict[str, Any] = Field(default_factory=dict)


class SimulateActionResponse(BaseModel):
    ok: bool
    action_id: str
    capability: str
    status: str
    received: SimulateActionRequest


capabilities = [
    {
        "id": "actions.simulate",
        "tool": "actions",
        "name": "Simulate Action",
        "description": "Pretend to execute a tool call and return a traceable result.",
        "method": "POST",
        "endpoint": "/actions/simulate",
        "input_model": "SimulateActionRequest",
        "output_model": "SimulateActionResponse",
        "tags": ["debug", "action"],
    }
]


@router.post("/simulate", response_model=SimulateActionResponse)
def simulate_action(payload: SimulateActionRequest):
    return SimulateActionResponse(
        ok=True,
        action_id=f"act_{int(time() * 1000)}",
        capability=payload.capability,
        status="simulated",
        received=payload,
    )
