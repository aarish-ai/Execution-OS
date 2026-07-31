import asyncio
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.database import Base

try:
    import pytest_asyncio
    @pytest_asyncio.fixture
    async def async_session() -> AsyncSession:
        engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
        async with session_factory() as session:
            yield session

        await engine.dispose()
except ImportError:
    pass
