from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Page
from app.schemas import PageOut

router = APIRouter(prefix="/api/pages", tags=["pages"])


@router.get("", response_model=list[PageOut])
def list_pages(db: Session = Depends(get_db)) -> list[Page]:
    rows = db.scalars(select(Page).order_by(Page.slug)).all()
    return list(rows)


@router.get("/{slug}", response_model=PageOut)
def get_page(slug: str, db: Session = Depends(get_db)) -> Page:
    row = db.scalar(select(Page).where(Page.slug == slug))
    if row is None:
        raise HTTPException(status_code=404, detail="Page not found")
    return row
