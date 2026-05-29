from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

for module in tool_modules:
    app.include_router(module.router)


@app.get("/health", tags=["system"])
def health():
    return {"ok": True, "service": "fluid-os-mock-backend"}


@app.get("/capabilities", tags=["system"])
def capabilities():
    return {
        "capabilities": [
            capability
            for module in tool_modules
            for capability in module.capabilities
        ]
    }
