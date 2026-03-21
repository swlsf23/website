import getpass
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

# Homebrew Postgres on macOS uses your OS user, not a "postgres" role. Default matches that.
_DEFAULT_DATABASE_URL = (
    f"postgresql+psycopg2://{getpass.getuser()}@127.0.0.1:5432/website"
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = _DEFAULT_DATABASE_URL


@lru_cache
def get_settings() -> Settings:
    return Settings()
