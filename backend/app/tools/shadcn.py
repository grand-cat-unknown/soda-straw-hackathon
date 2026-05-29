import asyncio
import os
import sys
from contextlib import AsyncExitStack
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from pydantic import BaseModel, Field

tool_name = "shadcn"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])


def _resolve_project_cwd() -> str:
    configured = os.environ.get("SHADCN_PROJECT_CWD")
    if configured:
        return str(Path(configured).expanduser().resolve())

    # Default to the sibling `os` Next.js project in this repo.
    repo_root = Path(__file__).resolve().parents[3]
    return str((repo_root / "os").resolve())


class _ShadcnMcpClient:
    """Long-lived MCP stdio client for the official shadcn MCP server."""

    def __init__(self, cwd: str) -> None:
        self._cwd = cwd
        self._session: ClientSession | None = None
        self._exit_stack: AsyncExitStack | None = None
        self._lock = asyncio.Lock()
        self._tools_cache: list[Any] | None = None

    @property
    def cwd(self) -> str:
        return self._cwd

    async def _ensure_started(self) -> ClientSession:
        if self._session is not None:
            return self._session

        async with self._lock:
            if self._session is not None:
                return self._session

            command = "npx.cmd" if sys.platform == "win32" else "npx"
            params = StdioServerParameters(
                command=command,
                args=["shadcn@latest", "mcp", "--cwd", self._cwd],
                cwd=self._cwd,
            )

            stack = AsyncExitStack()
            try:
                read, write = await stack.enter_async_context(stdio_client(params))
                session = await stack.enter_async_context(ClientSession(read, write))
                await session.initialize()
            except Exception:
                await stack.aclose()
                raise

            self._exit_stack = stack
            self._session = session
            return session

    async def list_tools(self) -> list[Any]:
        session = await self._ensure_started()
        if self._tools_cache is None:
            result = await session.list_tools()
            self._tools_cache = list(result.tools)
        return self._tools_cache

    async def call_tool(self, name: str, arguments: dict[str, Any]) -> Any:
        session = await self._ensure_started()
        return await session.call_tool(name, arguments)


_client = _ShadcnMcpClient(_resolve_project_cwd())


capabilities = [
    {
        "id": "shadcn.list_tools",
        "tool": "shadcn",
        "name": "List shadcn MCP Tools",
        "description": "List the tools exposed by the local shadcn MCP server.",
        "method": "GET",
        "endpoint": "/shadcn/tools",
        "output_model": "ShadcnToolsResponse",
        "tags": ["shadcn", "ui", "components"],
    },
    {
        "id": "shadcn.call_tool",
        "tool": "shadcn",
        "name": "Call shadcn MCP Tool",
        "description": (
            "Invoke a tool on the shadcn MCP server. Use /shadcn/tools to discover "
            "available tool names and their input schemas."
        ),
        "method": "POST",
        "endpoint": "/shadcn/call",
        "input_model": "ShadcnCallRequest",
        "output_model": "ShadcnCallResponse",
        "tags": ["shadcn", "ui", "components"],
    },
]


class ShadcnToolInfo(BaseModel):
    name: str
    description: str | None = None
    input_schema: dict[str, Any] | None = None


class ShadcnToolsResponse(BaseModel):
    project_cwd: str
    tools: list[ShadcnToolInfo]


class ShadcnCallRequest(BaseModel):
    name: str = Field(..., description="Name of the shadcn MCP tool to call.")
    arguments: dict[str, Any] = Field(
        default_factory=dict,
        description="Arguments object matching the tool's input schema.",
    )


class ShadcnContentBlock(BaseModel):
    type: str
    text: str | None = None
    data: Any | None = None


class ShadcnCallResponse(BaseModel):
    is_error: bool = False
    content: list[ShadcnContentBlock]


def _serialize_content(content: Any) -> list[ShadcnContentBlock]:
    blocks: list[ShadcnContentBlock] = []
    for item in content or []:
        block_type = getattr(item, "type", None) or "unknown"
        text = getattr(item, "text", None)
        # Anything else (image, resource, etc.) gets serialized via model_dump.
        extra: Any = None
        if text is None and hasattr(item, "model_dump"):
            extra = item.model_dump(mode="json")
        blocks.append(ShadcnContentBlock(type=block_type, text=text, data=extra))
    return blocks


@router.get("/tools", response_model=ShadcnToolsResponse)
async def list_shadcn_tools() -> ShadcnToolsResponse:
    try:
        tools = await _client.list_tools()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"shadcn MCP unavailable: {exc}")

    return ShadcnToolsResponse(
        project_cwd=_client.cwd,
        tools=[
            ShadcnToolInfo(
                name=tool.name,
                description=tool.description,
                input_schema=tool.inputSchema,
            )
            for tool in tools
        ],
    )


@router.post("/call", response_model=ShadcnCallResponse)
async def call_shadcn_tool(payload: ShadcnCallRequest) -> ShadcnCallResponse:
    try:
        result = await _client.call_tool(payload.name, payload.arguments)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"shadcn MCP call failed: {exc}")

    return ShadcnCallResponse(
        is_error=bool(getattr(result, "isError", False)),
        content=_serialize_content(getattr(result, "content", [])),
    )
