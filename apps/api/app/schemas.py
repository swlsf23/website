from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    title: str
    body_md: str
    created_at: datetime
    updated_at: datetime
