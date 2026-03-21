# Website API (FastAPI)

## Python environment (read this first)

**Do not** run `pip install` for this project unless a venv is active (`(.venv)` in your prompt). That keeps packages **only** under `apps/api/.venv/`, which is gitignored.

**Preferred:** from the **repository root**, run:

```bash
chmod +x scripts/bootstrap_api_venv.sh   # once
./scripts/bootstrap_api_venv.sh
```

Or manually:

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Always use **`python -m pip`**, not bare **`pip`**, so you hit the venv’s Python.

## Database

1. Create a Postgres database (e.g. `createdb website`).
2. Copy `.env.example` to `.env` and set `DATABASE_URL`.

## Migrate and seed

With `apps/api/.venv` activated and `cwd` in `apps/api`:

```bash
alembic upgrade head
cd ../..
python scripts/seed_db.py
cd apps/api
```

From repo root without activating the shell, use the venv’s interpreter so seed never touches global Python:

```bash
apps/api/.venv/bin/python scripts/seed_db.py
```

## Run

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Health: `GET /health`
- Pages: `GET /api/pages`, `GET /api/pages/{slug}`

With the Vite dev server, `apps/web` proxies `/api` and `/health` to this process.

## If you installed these packages globally by mistake

Only if you are sure nothing else on your machine needs them:

```bash
python3 -m pip uninstall -y \
  fastapi uvicorn sqlalchemy alembic psycopg2-binary pydantic-settings python-dotenv pyyaml
```

You may still see leftover dependencies from that install; `python3 -m pip list` to inspect. For a Brew-managed Python, `brew reinstall python@3.12` (adjust version) resets the Brew prefix’s site-packages—use only if you understand the impact on other global tools.
