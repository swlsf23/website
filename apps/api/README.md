# Website API (FastAPI)

## Setup

1. Create a Postgres database (e.g. `website`) and user; set `DATABASE_URL` in `.env` (see `.env.example`).
2. From this directory:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
```

3. Seed pages from repo-root `content/`:

```bash
cd ../..
python scripts/seed_db.py
cd apps/api
```

## Run

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Health: `GET /health`
- Pages: `GET /api/pages`, `GET /api/pages/{slug}`

With the Vite dev server, `apps/web` proxies `/api` and `/health` to this process.
