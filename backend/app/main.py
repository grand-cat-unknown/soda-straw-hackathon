from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.auth import API_KEY_HEADER, DEFAULT_API_KEY, verify_api_key
from app.tools import tool_modules

app = FastAPI(
    title="Fluid OS Mock Capability API",
    description="Real HTTP APIs over fake hackathon data for the Fluid Modular OS prototype.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

tool_registry = {
    module.tool_name: {
        "name": module.tool_name,
        "base_url_path": module.router.prefix,
        "openapi_path": f"/{module.tool_name}/openapi.json",
        "health_path": f"/{module.tool_name}/health",
        "auth": {"type": "api_key", "header": API_KEY_HEADER},
    }
    for module in tool_modules
}


@app.get("/health", tags=["system"])
def health():
    return {"ok": True, "service": "fluid-os-mock-backend"}


@app.get("/tools", tags=["system"], dependencies=[Depends(verify_api_key)])
def tools(request: Request):
    return {
        "base_url": str(request.base_url).rstrip("/"),
        "api_key_header": API_KEY_HEADER,
        "default_api_key": DEFAULT_API_KEY,
        "tools": list(tool_registry.values()),
    }


@app.get("/capabilities", tags=["system"], dependencies=[Depends(verify_api_key)])
def capabilities():
    return {
        "capabilities": [
            {
                **capability,
                "base_url_path": tool_registry[capability["tool"]]["base_url_path"],
                "openapi_path": tool_registry[capability["tool"]]["openapi_path"],
                "auth": tool_registry[capability["tool"]]["auth"],
            }
            for module in tool_modules
            for capability in module.capabilities
        ]
    }


@app.get("/{tool_name}/health", tags=["tool metadata"], dependencies=[Depends(verify_api_key)])
def tool_health(tool_name: str):
    if tool_name not in tool_registry:
        raise HTTPException(status_code=404, detail=f"Tool {tool_name} not found.")

    return {"ok": True, "tool": tool_name}


@app.get("/{tool_name}/openapi.json", tags=["tool metadata"], dependencies=[Depends(verify_api_key)])
def tool_openapi(tool_name: str):
    tool = tool_registry.get(tool_name)
    if not tool:
        raise HTTPException(status_code=404, detail=f"Tool {tool_name} not found.")

    full_schema = app.openapi()
    prefix = tool["base_url_path"]
    paths = {}

    for path, path_schema in full_schema["paths"].items():
        if path == prefix:
            paths["/"] = path_schema
        elif path.startswith(f"{prefix}/"):
            paths[path.removeprefix(prefix)] = path_schema

    return {
        "openapi": full_schema["openapi"],
        "info": {
            "title": f"Fluid OS {tool_name.title()} Tool API",
            "version": app.version,
            "description": f"Standalone schema for the {tool_name} tool prefix.",
        },
        "servers": [{"url": prefix}],
        "paths": paths,
        "components": full_schema.get("components", {}),
    }


for module in tool_modules:
    app.include_router(module.router, dependencies=[Depends(verify_api_key)])
