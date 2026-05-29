#!/usr/bin/env bash

set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$BACKEND_DIR/.." && pwd)"

if [[ -f "$BACKEND_DIR/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$BACKEND_DIR/.env"
  set +a
fi

BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8787}"
NGROK_REGION="${NGROK_REGION:-}"
NGROK_URL="${NGROK_URL:-https://uncombed-wand-unfitted.ngrok-free.dev}"
FLUID_OS_API_KEY="${FLUID_OS_API_KEY:-fluid-os-dev-key}"
SODA_STRAW_RESET="${SODA_STRAW_RESET:-}"
NGROK_API_URL="http://127.0.0.1:4040/api/tunnels"
NGROK_LOG="${NGROK_LOG:-/tmp/fluid-os-ngrok.log}"
PYTHON_BIN=""

backend_pid=""
ngrok_pid=""

cleanup() {
  if [[ -n "$ngrok_pid" ]] && kill -0 "$ngrok_pid" 2>/dev/null; then
    kill "$ngrok_pid" 2>/dev/null || true
  fi

  if [[ -n "$backend_pid" ]] && kill -0 "$backend_pid" 2>/dev/null; then
    kill "$backend_pid" 2>/dev/null || true
  fi
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local attempts="${3:-40}"

  for _ in $(seq 1 "$attempts"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done

  echo "Timed out waiting for $label at $url" >&2
  return 1
}

require_command() {
  local command_name="$1"
  local install_hint="$2"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name" >&2
    echo "$install_hint" >&2
    exit 1
  fi
}

get_public_url() {
  curl -fsS "$NGROK_API_URL" \
    | "$PYTHON_BIN" -c 'import json,sys; tunnels=json.load(sys.stdin).get("tunnels", []); https=next((t["public_url"] for t in tunnels if t.get("proto") == "https"), None); print(https or (tunnels[0]["public_url"] if tunnels else ""))'
}

wait_for_public_url() {
  local attempts="${1:-60}"
  local public_url=""

  for _ in $(seq 1 "$attempts"); do
    if [[ -n "$ngrok_pid" ]] && ! kill -0 "$ngrok_pid" 2>/dev/null; then
      echo "ngrok exited before creating a public tunnel." >&2
      echo "ngrok log: $NGROK_LOG" >&2
      sed -n '1,160p' "$NGROK_LOG" >&2 || true
      return 1
    fi

    public_url="$(get_public_url 2>/dev/null || true)"
    if [[ -n "$public_url" ]]; then
      echo "$public_url"
      return 0
    fi

    sleep 0.5
  done

  echo "Timed out waiting for ngrok to create a public tunnel." >&2
  echo "ngrok log: $NGROK_LOG" >&2
  sed -n '1,160p' "$NGROK_LOG" >&2 || true
  return 1
}

print_registry() {
  local public_url="$1"
  local tools=(contacts calendar tasks shopping budget messages actions)

  echo
  echo "Backend is local:  http://$BACKEND_HOST:$BACKEND_PORT"
  echo "Backend is public: $public_url"
  echo
  echo "Shared auth header:"
  echo "  X-API-Key: $FLUID_OS_API_KEY"
  echo
  echo "Hub registry:"
  echo "  Tools:        $public_url/tools"
  echo "  Capabilities: $public_url/capabilities"
  echo "  Full OpenAPI: $public_url/openapi.json"
  echo
  echo "Register individual tools:"

  for tool in "${tools[@]}"; do
    echo "  $tool"
    echo "    Base URL: $public_url/$tool"
    echo "    OpenAPI:  $public_url/$tool/openapi.json"
  done

  echo
  echo "Press Ctrl+C to stop backend and ngrok."
}

main() {
  require_command "uv" "Install UV first: https://docs.astral.sh/uv/"
  require_command "ngrok" "Install ngrok first: https://ngrok.com/download"
  require_command "curl" "Install curl first, then rerun this script."

  if command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="python3"
  elif command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
  else
    echo "Missing required command: python3" >&2
    echo "Install Python first, then rerun this script." >&2
    exit 1
  fi

  trap cleanup EXIT INT TERM

  echo "Starting FastAPI backend on http://$BACKEND_HOST:$BACKEND_PORT ..."
  (
    cd "$ROOT_DIR"
    FLUID_OS_API_KEY="$FLUID_OS_API_KEY" uv run --project "$BACKEND_DIR" \
      uvicorn app.main:app --app-dir "$BACKEND_DIR" --host "$BACKEND_HOST" --port "$BACKEND_PORT"
  ) &
  backend_pid="$!"

  wait_for_url "http://$BACKEND_HOST:$BACKEND_PORT/health" "backend"

  echo "Starting ngrok tunnel for port $BACKEND_PORT ..."
  : > "$NGROK_LOG"
  ngrok_args=(http "http://$BACKEND_HOST:$BACKEND_PORT" --log=stdout)

  if [[ -n "$NGROK_REGION" ]]; then
    ngrok_args+=(--region "$NGROK_REGION")
  fi

  if [[ -n "$NGROK_URL" ]]; then
    ngrok_args+=(--url "$NGROK_URL")
  fi

  ngrok "${ngrok_args[@]}" >"$NGROK_LOG" 2>&1 &
  ngrok_pid="$!"

  public_url="$(wait_for_public_url)"

  print_registry "$public_url"

  if [[ -n "$SODA_STRAW_RESET" ]]; then
    echo
    echo "Resetting Soda Straw straws from backend tool registry ..."
    FLUID_OS_PUBLIC_URL="$public_url" FLUID_OS_API_KEY="$FLUID_OS_API_KEY" \
      "$PYTHON_BIN" "$BACKEND_DIR/scripts/sync_soda_straw_straws.py"
  fi

  wait "$backend_pid"
}

main "$@"
