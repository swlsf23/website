import getpass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Always load this file — not "whatever .env is in cwd" (uvicorn from repo root broke that).
_API_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_API_ROOT / ".env", override=True)

# Homebrew Postgres on macOS uses your OS user, not a "postgres" role. Default matches that.
_DEFAULT_DATABASE_URL = (
    f"postgresql+psycopg2://{getpass.getuser()}@127.0.0.1:5432/website"
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_API_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = _DEFAULT_DATABASE_URL


@lru_cache
def get_settings() -> Settings:
    return Settings()
