import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import get_db


@pytest.mark.asyncio
async def test_new_endpoints_empty(async_session):
    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res_c = await ac.get("/api/v1/contradictions/")
            assert res_c.status_code == 200
            assert isinstance(res_c.json(), list)

            res_q = await ac.get("/api/v1/questions/")
            assert res_q.status_code == 200
            assert isinstance(res_q.json(), list)

            res_d = await ac.get("/api/v1/drift-alerts/")
            assert res_d.status_code == 200
            assert isinstance(res_d.json(), list)

            res_t = await ac.get("/api/v1/topics/")
            assert res_t.status_code == 200
            assert isinstance(res_t.json(), list)

            with patch("app.api.v1.endpoints.briefs.generate_weekly_brief_service", return_value="# Weekly Brief"):
                res_b = await ac.post("/api/v1/briefs/weekly/generate")
                assert res_b.status_code == 200
                assert "content" in res_b.json()
    finally:
        app.dependency_overrides.clear()
