# Soda Straw Sync

The backend can be registered in Soda Straw as one Generic API straw per tool
prefix. This keeps each capability independently visible and callable.

## Current Straws

Expected straw names after sync:

- `fluid-os-contacts`
- `fluid-os-calendar`
- `fluid-os-tasks`
- `fluid-os-shopping`
- `fluid-os-budget`
- `fluid-os-messages`
- `fluid-os-actions`

Each straw points at the static ngrok domain:

```txt
https://uncombed-wand-unfitted.ngrok-free.dev
```

Each straw uses custom-header auth:

```txt
X-API-Key: fluid-os-dev-key
```

## Reset Flow

The reset script is:

```txt
backend/scripts/sync_soda_straw_straws.py
```

It performs this sequence:

1. Reads the live backend registry from `GET {public_url}/tools`.
2. Lists existing Soda Straw straws from `GET {soda_straw_url}/api/straws`.
3. Deletes existing straws whose names start with `fluid-os-`.
4. Creates one Generic API straw per backend tool prefix.
5. Refreshes the tool manifest for each new straw.

Run with the launcher:

```sh
SODA_STRAW_API_KEY=your-soda-straw-api-key SODA_STRAW_RESET=1 ./launch-backend-ngrok.sh
```

Run only the sync script:

```sh
SODA_STRAW_API_KEY=your-soda-straw-api-key backend/scripts/sync_soda_straw_straws.py
```

## Environment Variables

- `SODA_STRAW_API_KEY` - required by the sync script.
- `SODA_STRAW_URL` - defaults to `https://srikanthganta.straw.demo.soda.io`.
- `FLUID_OS_PUBLIC_URL` - public backend URL; launcher sets this to the live ngrok URL.
- `NGROK_URL` - static ngrok endpoint, defaults to `https://uncombed-wand-unfitted.ngrok-free.dev`.
- `FLUID_OS_API_KEY` - backend API key, defaults to `fluid-os-dev-key`.
- `SODA_STRAW_STRAW_PREFIX` - deletion/recreation prefix, defaults to `fluid-os-`.
- `SODA_STRAW_DRY_RUN=1` - preview without deleting or creating.
- `SODA_STRAW_DELETE_ALL=1` - delete every straw in the workspace before recreating Fluid OS tools. Use with care; prefer setting this inline for one command instead of storing it in `.env`.

## API Key

Generate a Soda Straw API key from:

```txt
https://srikanthganta.straw.demo.soda.io/connect
```

Do not commit API keys. Put local secrets in `.env` files or shell environment
variables.

The sync script loads `.env` and `backend/.env` if they exist. Shell
environment variables win over values in those files.
