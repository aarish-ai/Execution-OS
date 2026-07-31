from fastapi import APIRouter
from app.api.v1.endpoints import meetings, tasks, decisions, search, briefs

api_router = APIRouter()

api_router.include_router(meetings.router, prefix="/meetings", tags=["Meetings"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(decisions.router, prefix="/decisions", tags=["Decisions"])
api_router.include_router(search.router, prefix="/search", tags=["Search"])
api_router.include_router(briefs.router, prefix="/briefs", tags=["Briefs"])
