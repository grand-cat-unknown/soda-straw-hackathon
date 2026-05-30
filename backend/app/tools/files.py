from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

tool_name = "files"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])


class FileStoreRequest(BaseModel):
    name: str
    mime_type: str
    size_bytes: int
    labels: list[str] = Field(default_factory=list)
    linked_intent_id: str | None = None
    linked_entities: list[str] = Field(default_factory=list)


class FileRecord(BaseModel):
    id: str
    name: str
    mime_type: str
    size_bytes: int
    labels: list[str] = Field(default_factory=list)
    linked_intent_id: str | None = None
    linked_entities: list[str] = Field(default_factory=list)
    url: str


class FileLink(BaseModel):
    entity: str


class FilesResponse(BaseModel):
    files: list[FileRecord]


files: list[FileRecord] = [
    FileRecord(
        id="file_001",
        name="venue-floor-plan.pdf",
        mime_type="application/pdf",
        size_bytes=184_320,
        labels=["venue", "reference"],
        url="/files/file_001/download",
    )
]


capabilities = [
    {
        "id": "files.list",
        "tool": "files",
        "name": "List Files",
        "description": "List stored files with labels and links.",
        "method": "GET",
        "endpoint": "/files",
        "output_model": "FilesResponse",
        "tags": ["files"],
    },
    {
        "id": "files.store",
        "tool": "files",
        "name": "Store File",
        "description": "Register a file (metadata only in mock).",
        "method": "POST",
        "endpoint": "/files",
        "input_model": "FileStoreRequest",
        "output_model": "FileRecord",
        "tags": ["files", "action"],
    },
    {
        "id": "files.get",
        "tool": "files",
        "name": "Get File",
        "description": "Fetch a file record by ID.",
        "method": "GET",
        "endpoint": "/files/{file_id}",
        "output_model": "FileRecord",
        "tags": ["files"],
    },
    {
        "id": "files.link",
        "tool": "files",
        "name": "Link File",
        "description": "Link a file to another entity (row, event, person, task, note).",
        "method": "POST",
        "endpoint": "/files/{file_id}/link",
        "input_model": "FileLink",
        "output_model": "FileRecord",
        "tags": ["files", "action"],
    },
]


def _find(file_id: str) -> tuple[int, FileRecord]:
    for index, record in enumerate(files):
        if record.id == file_id:
            return index, record
    raise HTTPException(status_code=404, detail=f"File {file_id} not found.")


@router.get("", response_model=FilesResponse)
def list_files():
    return FilesResponse(files=files)


@router.post("", response_model=FileRecord, status_code=201)
def store_file(payload: FileStoreRequest):
    file_id = f"file_{len(files) + 1:03d}"
    record = FileRecord(id=file_id, url=f"/files/{file_id}/download", **payload.model_dump())
    files.append(record)
    return record


@router.get("/{file_id}", response_model=FileRecord)
def get_file(file_id: str):
    return _find(file_id)[1]


@router.post("/{file_id}/link", response_model=FileRecord)
def link_file(file_id: str, payload: FileLink):
    index, record = _find(file_id)
    updated = record.model_copy(update={"linked_entities": [*record.linked_entities, payload.entity]})
    files[index] = updated
    return updated
