#!/usr/bin/env python3
"""Recreate Soda Straw straws for the Fluid OS mock backend."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any
from dotenv import load_dotenv

load_dotenv()

DEFAULT_SODA_STRAW_URL = "https://srikanthganta.straw.demo.soda.io"
DEFAULT_PUBLIC_URL = "https://uncombed-wand-unfitted.ngrok-free.dev"
DEFAULT_BACKEND_API_KEY = "fluid-os-dev-key"
DEFAULT_STRAW_PREFIX = "fluid-os-"


@dataclass(frozen=True)
class Config:
    soda_straw_url: str
    soda_straw_api_key: str
    public_url: str
    backend_api_key: str
    straw_prefix: str
    delete_all: bool
    dry_run: bool


def env_bool(name: str) -> bool:
    return os.getenv(name, "").strip().lower() in {"1", "true", "yes", "on"}


def load_config() -> Config:
    api_key = os.getenv("SODA_STRAW_API_KEY", "").strip()
    if not api_key:
        print(
            "Missing SODA_STRAW_API_KEY. Generate one in Soda Straw, then rerun.",
            file=sys.stderr,
        )
        sys.exit(2)

    return Config(
        soda_straw_url=os.getenv("SODA_STRAW_URL", DEFAULT_SODA_STRAW_URL).rstrip("/"),
        soda_straw_api_key=api_key,
        public_url=os.getenv(
            "FLUID_OS_PUBLIC_URL", os.getenv("NGROK_URL", DEFAULT_PUBLIC_URL)
        ).rstrip("/"),
        backend_api_key=os.getenv("FLUID_OS_API_KEY", DEFAULT_BACKEND_API_KEY),
        straw_prefix=os.getenv("SODA_STRAW_STRAW_PREFIX", DEFAULT_STRAW_PREFIX),
        delete_all=env_bool("SODA_STRAW_DELETE_ALL"),
        dry_run=env_bool("SODA_STRAW_DRY_RUN"),
    )


def request_json(
    method: str,
    url: str,
    *,
    headers: dict[str, str] | None = None,
    body: dict[str, Any] | None = None,
) -> Any:
    payload = None
    request_headers = dict(headers or {})
    if body is not None:
        payload = json.dumps(body).encode("utf-8")
        request_headers["Content-Type"] = "application/json"

    req = urllib.request.Request(
        url, data=payload, headers=request_headers, method=method
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            data = response.read()
            if not data:
                return None
            return json.loads(data.decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"{method} {url} failed with HTTP {exc.code}: {detail}"
        ) from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"{method} {url} failed: {exc.reason}") from exc


def soda_headers(config: Config) -> dict[str, str]:
    return {"Authorization": f"Bearer {config.soda_straw_api_key}"}


def fetch_backend_tools(config: Config) -> tuple[str, list[dict[str, Any]]]:
    data = request_json(
        "GET",
        f"{config.public_url}/tools",
        headers={"X-API-Key": config.backend_api_key},
    )
    tools = data.get("tools", [])
    if not isinstance(tools, list) or not tools:
        raise RuntimeError(f"No tools found at {config.public_url}/tools")
    api_key_header = data.get("api_key_header") or "X-API-Key"
    return api_key_header, tools


def list_straws(config: Config) -> list[dict[str, Any]]:
    data = request_json(
        "GET",
        f"{config.soda_straw_url}/api/straws",
        headers=soda_headers(config),
    )
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        straws = data.get("straws", [])
        if isinstance(straws, list):
            return straws
    raise RuntimeError("Unexpected Soda Straw /api/straws response shape.")


def straw_id(straw: dict[str, Any]) -> str:
    value = straw.get("id") or straw.get("straw_id")
    if not isinstance(value, str) or not value:
        raise RuntimeError(f"Could not find straw id in response: {straw}")
    return value


def straw_name(straw: dict[str, Any]) -> str:
    value = straw.get("name") or straw.get("straw_name")
    if not isinstance(value, str):
        return ""
    return value


def delete_straw(config: Config, straw: dict[str, Any]) -> None:
    sid = straw_id(straw)
    name = straw_name(straw)
    print(f"Deleting {name or sid}")
    if config.dry_run:
        return
    request_json(
        "DELETE",
        f"{config.soda_straw_url}/api/straws/{urllib.parse.quote(sid)}",
        headers=soda_headers(config),
    )


def create_straw(
    config: Config,
    tool: dict[str, Any],
    *,
    backend_api_key_header: str,
) -> str:
    tool_name = tool["name"]
    base_url_path = tool["base_url_path"]
    openapi_path = tool["openapi_path"]
    name = f"{config.straw_prefix}{tool_name}"
    body = {
        "type": "api",
        "name": name,
        "description": f"Fluid OS mock {tool_name} API exposed through the static ngrok backend.",
        "server_url": f"{config.public_url}{base_url_path}",
        "auth_method": "custom_header",
        "custom_header_name": backend_api_key_header,
        "custom_header_value": config.backend_api_key,
        "openapi_spec_url": f"{config.public_url}{openapi_path}",
    }

    print(f"Creating {name}")
    if config.dry_run:
        return "dry-run"

    response = request_json(
        "POST",
        f"{config.soda_straw_url}/api/straws",
        headers=soda_headers(config),
        body=body,
    )
    sid = response.get("id") or response.get("straw_id")
    if not sid:
        raise RuntimeError(f"Create response did not include an id: {response}")

    request_json(
        "POST",
        f"{config.soda_straw_url}/api/straws/{urllib.parse.quote(sid)}/refresh-tools",
        headers=soda_headers(config),
    )
    return sid


def main() -> int:
    config = load_config()
    print(f"Backend:    {config.public_url}")
    print(f"Soda Straw: {config.soda_straw_url}")
    print(
        f"Scope:      {'all straws' if config.delete_all else config.straw_prefix + '*'}"
    )
    if config.dry_run:
        print("Dry run:    yes")

    backend_api_key_header, tools = fetch_backend_tools(config)
    existing = list_straws(config)
    to_delete = [
        straw
        for straw in existing
        if config.delete_all or straw_name(straw).startswith(config.straw_prefix)
    ]

    for straw in to_delete:
        delete_straw(config, straw)

    created = [
        create_straw(config, tool, backend_api_key_header=backend_api_key_header)
        for tool in tools
    ]

    print(f"Done. Deleted {len(to_delete)} straws and created {len(created)} straws.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1)
