import os

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

API_KEY_HEADER = "X-API-Key"
DEFAULT_API_KEY = "fluid-os-dev-key"

api_key_header = APIKeyHeader(name=API_KEY_HEADER, auto_error=False)


def expected_api_key() -> str:
    return os.getenv("FLUID_OS_API_KEY", DEFAULT_API_KEY)


def verify_api_key(api_key: str | None = Security(api_key_header)) -> str:
    if api_key == expected_api_key():
        return api_key

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=f"Missing or invalid {API_KEY_HEADER}.",
    )
