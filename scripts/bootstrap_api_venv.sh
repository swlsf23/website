#!/usr/bin/env bash
# Create apps/api/.venv and install deps with python -m pip only (never global pip).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT/apps/api"

if [[ ! -f "$API_DIR/requirements.txt" ]]; then
  echo "Expected $API_DIR/requirements.txt — run from repo with scripts/ intact." >&2
  exit 1
fi

cd "$API_DIR"

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi

# shellcheck disable=SC1091
source .venv/bin/activate

python -m pip install --upgrade pip
python -m pip install -r requirements.txt

echo ""
echo "API venv ready. Activate before alembic/uvicorn:"
echo "  source apps/api/.venv/bin/activate"
echo "(from repo root) or: cd apps/api && source .venv/bin/activate"
