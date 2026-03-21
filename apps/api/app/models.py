from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Page(Base):
    __tablename__ = "pages"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(500))
    body_md: Mapped[str] = mapped_column(Text())
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
