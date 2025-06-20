from datetime import datetime
from typing import Any
from sqlalchemy import create_engine, Column, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
import os

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://apiary:apiary123@localhost:5433/apiary_db")

if os.getenv("ALEMBIC") == "1":
    # Для Alembic нужен sync engine
    engine = create_engine(SQLALCHEMY_DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://").replace("postgresql://", "postgresql+psycopg2://"))
    SessionLocal = sessionmaker(engine, expire_on_commit=False)
else:
    # Для приложения — async engine
    engine = create_async_engine(SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"))
    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()


class TimestampMixin:
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)


async def get_db() -> AsyncSession:
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()