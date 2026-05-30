from pydantic import BaseModel, Field


class UiCandidate(BaseModel):
    widget_type: str
    input_port: str
    result_path: str = "$"
    purpose: str
    transform: str | None = None


class UiActionCandidate(BaseModel):
    name: str
    capability_id: str
    purpose: str
    refresh: list[str] = Field(default_factory=list)


class Capability(BaseModel):
    id: str
    tool: str
    name: str
    description: str
    method: str
    endpoint: str
    input_model: str | None = None
    output_model: str | None = None
    tags: list[str] = Field(default_factory=list)
    ui_candidates: list[UiCandidate] = Field(default_factory=list)
    ui_actions: list[UiActionCandidate] = Field(default_factory=list)
