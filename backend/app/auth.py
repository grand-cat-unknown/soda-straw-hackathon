import os

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

API_KEY_HEADER = "X-API-Key"

api_key_header = APIKeyHeader(name=API_KEY_HEADER, auto_error=False)


def expected_api_key() -> str:
    """
    Retrieve the expected API key from the FLUID_OS_API_KEY environment variable.

    Raises:
        RuntimeError: If FLUID_OS_API_KEY is not set, preventing authentication bypass.

    Returns:
        str: The configured API key.
    """
    api_key = os.getenv("FLUID_OS_API_KEY")
    if not api_key:
        raise RuntimeError(
            "FLUID_OS_API_KEY environment variable is not set. "
            "The application cannot authenticate requests without a configured API key."
        )
    return api_key


def verify_api_key(api_key: str | None = Security(api_key_header)) -> str:
    """
    Verify that the provided API key matches the expected API key.

    Args:
        api_key: The API key from the request header.

    Raises:
        HTTPException: If the API key is missing, invalid, or if FLUID_OS_API_KEY is not configured.

    Returns:
        str: The verified API key.
    """
    try:
        expected_key = expected_api_key()
    except RuntimeError as e:
        # Configuration error - fail securely by rejecting all authentication attempts
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="API authentication is not properly configured.",
        ) from e

    if api_key and api_key == expected_key:
        return api_key

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=f"Missing or invalid {API_KEY_HEADER}.",
    )
