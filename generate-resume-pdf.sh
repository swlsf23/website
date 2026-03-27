#!/usr/bin/env bash
# Build apps/web/public/resume.pdf from content/resume.md (Playwright + print CSS).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/apps/web"

npm install
npx playwright install chromium
npm run resume:pdf
