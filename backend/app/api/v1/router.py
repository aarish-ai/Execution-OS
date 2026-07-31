from fastapi import APIRouter, Depends
from app.core.auth import verify_api_key
from app.api.v1.endpoints import (
    meetings,
    tasks,
    decisions,
    search,
    briefs,
    contradictions,
    questions,
    drift,
    topics,
    progress,
)

api_router = APIRouter(dependencies=[Depends(verify_api_key)])

api_router.include_router(meetings.router, prefix="/meetings", tags=["Meetings"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(decisions.router, prefix="/decisions", tags=["Decisions"])
api_router.include_router(search.router, prefix="/search", tags=["Search"])
api_router.include_router(briefs.router, prefix="/briefs", tags=["Briefs"])
api_router.include_router(contradictions.router, prefix="/contradictions", tags=["Contradictions"])
api_router.include_router(questions.router, prefix="/questions", tags=["Questions"])
api_router.include_router(drift.router, prefix="/drift-alerts", tags=["Drift Alerts"])
api_router.include_router(topics.router, prefix="/topics", tags=["Topics"])
api_router.include_router(progress.router, prefix="/progress", tags=["Progress"])
