import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# ------------------------------------------------------------------------
# 1. Configuración de imports para que Alembic vea tu app
# ------------------------------------------------------------------------
import os
import sys
from pathlib import Path

# Agregamos el directorio raíz del backend al PYTHONPATH
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.db.base import Base  # Importamos la Base con los modelos

# ------------------------------------------------------------------------
# 2. Configuración de Alembic
# ------------------------------------------------------------------------
config = context.config

# Interpretar archivo de log
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# ------------------------------------------------------------------------
# FIX: Escapar '%' en la URL para ConfigParser
# ------------------------------------------------------------------------
# ConfigParser lanza error si encuentra un '%' (lo trata como variable).
# Como tu password tiene caracteres url-encoded (ej: %2A), debemos
# duplicarlos (%%) para que ConfigParser los acepte literalmente.
db_url_escaped = settings.get_database_url().replace("%", "%%")
config.set_main_option("sqlalchemy.url", db_url_escaped)


def run_migrations_offline() -> None:
    """Correr migraciones en modo 'offline'."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Correr migraciones en modo 'online'."""
    
    # Intentamos obtener una conexión existente
    connectable = context.config.attributes.get("connection", None)

    if connectable is None:
        from sqlalchemy import create_engine
        
        # Usamos NullPool para Supabase (Session Pooler)
        pool_class = pool.NullPool if settings.NULL_POOL else pool.QueuePool
        
        # IMPORTANTE: Aquí usamos la URL original (settings.get_database_url())
        # SIN escapar los %, porque create_engine no usa ConfigParser.
        connectable = create_engine(
            settings.get_database_url(),
            poolclass=pool_class
        )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()