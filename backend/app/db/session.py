from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from app.core.config import settings

# Usamos NullPool para Supabase Session Pooler
engine = create_engine(
    settings.get_database_url(),
    poolclass=NullPool if settings.NULL_POOL else None
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)