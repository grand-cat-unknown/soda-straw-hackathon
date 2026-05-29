from pydantic import BaseModel, Field


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
