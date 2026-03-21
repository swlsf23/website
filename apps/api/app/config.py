import getpass
import os
from functools import lru_cache
from pathlib import Path
from typing import Self
from urllib.parse import urlparse, urlunparse

from dotenv import load_dotenv
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Always load this file — not "whatever .env is in cwd" (uvicorn from repo root broke that).
_API_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_API_ROOT / ".env", override=True)

# Homebrew Postgres on macOS uses your OS user, not a "postgres" role. Default matches that.
_DEFAULT_DATABASE_URL = (
    f"postgresql+psycopg2://{getpass.getuser()}@127.0.0.1:5432/website"
)


def _normalize_database_url(url: str) -> str:
    """Homebrew Postgres has no `postgres` role; replace with OS user for localhost only."""
    if not url:
        return url
    parsed = urlparse(url)
    if (parsed.username or "").lower() != "postgres":
        return url
    host = (parsed.hostname or "").lower()
    if host not in ("127.0.0.1", "localhost"):
        return url
    user = getpass.getuser()
    port = parsed.port or 5432
    netloc = f"{user}@{parsed.hostname}:{port}"
    fixed = parsed._replace(netloc=netloc)
    return urlunparse(fixed)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_API_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = _DEFAULT_DATABASE_URL

    @field_validator("database_url", mode="before")
    @classmethod
    def _normalize_postgres_local_user(cls, v: object) -> object:
        if isinstance(v, str):
            return _normalize_database_url(v)
        return v

    @model_validator(mode="after")
    def _sync_database_url_to_environ(self) -> Self:
        os.environ["DATABASE_URL"] = self.database_url
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
