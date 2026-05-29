# Tools

Each file in this folder is a fake capability module.

A tool module owns three things:

1. Mock data
2. Capability metadata
3. FastAPI route handling

The data can be fake, but the API contract should be real. Use Pydantic models for request and response bodies so FastAPI generates correct validation and OpenAPI docs.

## Shape

```python
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/example", tags=["example"])


class ExampleRequest(BaseModel):
    value: str


class ExampleResponse(BaseModel):
    ok: bool


capabilities = [
    {
        "id": "example.do_thing",
        "tool": "example",
        "name": "Do Thing",
        "description": "A short description for the OS planner.",
        "method": "POST",
        "endpoint": "/example/do-thing",
        "input_model": "ExampleRequest",
        "output_model": "ExampleResponse",
        "tags": ["example"],
    }
]


@router.post("/do-thing", response_model=ExampleResponse)
def do_thing(payload: ExampleRequest):
    return ExampleResponse(ok=True)
```

## Adding A Tool

1. Create a file in this folder, for example `weather.py`.
2. Add an `APIRouter`, Pydantic request/response models, and a `capabilities` list.
3. Add the module to `backend/app/tools/__init__.py`.

The server automatically exposes the capability in `GET /capabilities`, and FastAPI exposes the route schema in `GET /openapi.json`.
