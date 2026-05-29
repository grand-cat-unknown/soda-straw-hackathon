# Maintenance Checklist

Use this when changing backend tools, auth, public URLs, or Soda Straw setup.

## Backend Tool Changes

- Update or add the module in `backend/app/tools/`.
- Add new modules to `backend/app/tools/__init__.py`.
- Keep each module's `capabilities` list aligned with its FastAPI routes.
- Verify `GET /tools`, `GET /capabilities`, and `GET /{tool}/openapi.json`.
- Update `ai-docs/backend-capabilities.md`.

## Soda Straw Changes

- Keep `launch-backend-ngrok.sh` pointing at the correct static ngrok URL.
- Keep `backend/scripts/sync_soda_straw_straws.py` aligned with the Soda Straw REST API.
- After adding or renaming tools, run the reset flow:

```sh
SODA_STRAW_API_KEY=your-soda-straw-api-key SODA_STRAW_RESET=1 ./launch-backend-ngrok.sh
```

- If only previewing, add:

```sh
SODA_STRAW_DRY_RUN=1
```

## Documentation Changes

Update these files together when behavior changes:

- `README.md`
- `backend/README.md`
- `ai-docs/README.md`
- `ai-docs/backend-capabilities.md`
- `ai-docs/soda-straw-sync.md`

## Quick Verification

Run:

```sh
bash -n launch-backend-ngrok.sh
python3 -m py_compile backend/scripts/sync_soda_straw_straws.py
```

If the backend is running, also verify:

```sh
curl -fsS -H 'X-API-Key: fluid-os-dev-key' http://127.0.0.1:8787/tools
```
