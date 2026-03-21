#!/usr/bin/env python3
"""Load Markdown from content/ into Postgres (upsert by slug). Run from repo root."""

from __future__ import annotations

import sys
from pathlib import Path

import yaml
from dotenv import load_dotenv
from sqlalchemy import select

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "apps" / "api"))
load_dotenv(ROOT / "apps" / "api" / ".env")

from app.db import SessionLocal  # noqa: E402
from app.models import Page  # noqa: E402


def parse_markdown_file(path: Path) -> tuple[str, str, str]:
    text = path.read_text(encoding="utf-8")
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            meta = yaml.safe_load(parts[1]) or {}
            body = parts[2].strip()
            slug = str(meta.get("slug", path.stem))
            title = str(meta.get("title", slug))
            return slug, title, body
    first_line = text.strip().split("\n", 1)[0].strip("# ").strip() or path.stem
    return path.stem, first_line, text.strip()


def main() -> None:
    content_dir = ROOT / "content"
    if not content_dir.is_dir():
        raise SystemExit(f"Missing content directory: {content_dir}")

    md_files = sorted(content_dir.glob("*.md"))
    if not md_files:
        raise SystemExit(f"No .md files in {content_dir}")

    db = SessionLocal()
    try:
        for path in md_files:
            slug, title, body_md = parse_markdown_file(path)
            row = db.scalar(select(Page).where(Page.slug == slug))
            if row is None:
                db.add(Page(slug=slug, title=title, body_md=body_md))
                print(f"insert {slug}")
            else:
                row.title = title
                row.body_md = body_md
                print(f"update {slug}")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
