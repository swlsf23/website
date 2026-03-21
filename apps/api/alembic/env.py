from logging.config import fileConfig
from pathlib import Path

from dotenv import load_dotenv

# Load apps/api/.env before any app imports. override=True: a stray DATABASE_URL in
# your shell (e.g. ...postgres...) must not beat the file you edited in this repo.
_API_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_API_ROOT / ".env", override=True)

from alembic import context
from sqlalchemy import create_engine, pool

from app.config import get_settings
from app.models import Base

get_settings.cache_clear()

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = get_settings().database_url
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(
        get_settings().database_url,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
