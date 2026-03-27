#!/usr/bin/env bash
# Build resume.pdf and writing-samples.pdf (Playwright + print CSS).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/apps/web"

npm install
npx playwright install chromium
npm run resume:pdf:all
