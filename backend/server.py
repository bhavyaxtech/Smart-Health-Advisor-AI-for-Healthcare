from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.config import settings
from backend.database import (
    DatabaseUnavailableError,
    close_mongo_connection,
    connect_to_mongo,
    get_database,
    get_database_health,
)
from backend.external_integrations.pubmed import (
    build_pubmed_search_url,
    format_research_digest,
    get_pubmed_research,
)
from backend.repositories import (
    AnalysisPersistenceError,
    AnalysisRepository,
    UserRepository,
)
from backend.services.analysis import (
    build_analysis_response,
    build_chat_response,
    build_voice_response,
)
from backend.services.auth import (
    AuthError,
    AuthTokens,
    GoogleAuthRequest,
    build_auth_response,
    decode_access_token,
    extract_bearer_token,
    verify_google_id_token,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SymptomRequest(BaseModel):
    symptom: str = Field(..., min_length=1)
    duration: str = ""
    severity: str = ""
    additional_info: str = ""
    age: Optional[int] = None
    gender: str = ""
    medical_history: str = ""


class ChatMessage(BaseModel):
    message: str = Field(..., min_length=1)


class ChatResponse(BaseModel):
    response: str
    suggestions: List[str]
    follow_up_questions: List[str]
    ai_confidence: str


class HealthDashboard(BaseModel):
    user_id: str
    symptom_trends: List[Dict[str, Any]]
    health_score: int
    risk_factors: List[str]
    improvement_areas: List[str]
    ai_recommendations: List[str]


class VoiceInput(BaseModel):
    audio_text: str = Field(..., min_length=1)
    confidence: float = 1.0
    language: str = "en"


class DietRecommendation(BaseModel):
    foods_to_consume: List[str]
    foods_to_avoid: List[str]
    nutritional_focus: List[str]
    meal_suggestions: List[str]
    supplements: List[str]


class PossibleCause(BaseModel):
    condition: str
    probability: str
    description: str
    urgency_level: str
    ai_confidence: str


class AIInsight(BaseModel):
    insight_type: str
    title: str
    description: str
    recommendation: str
    evidence_level: str


class HealthResponse(BaseModel):
    symptom_analysis: str
    ai_web_research: str
    diet_plan: DietRecommendation
    possible_causes: List[PossibleCause]
    lifestyle_suggestions: List[str]
    red_flags: List[str]
    ai_insights: List[AIInsight]
    risk_assessment: Dict[str, Any]
    personalized_tips: List[str]
    medical_disclaimer: str
    search_timestamp: str


class CreditSummary(BaseModel):
    user_id: str
    email: str
    name: str
    picture: str
    credits_total: int
    credits_used: int
    credits_remaining: int
    has_credits: bool
    is_active: bool


class CurrentUserResponse(BaseModel):
    user_id: str
    google_sub: str
    email: str
    name: str
    picture: str
    credits_remaining: int
    created_at: str
    updated_at: str


class AnalysisHistoryItem(BaseModel):
    id: str
    symptom: str
    severity: str
    duration: str
    created_at: str
    risk_assessment: Dict[str, Any]


class PatternAnalysisResponse(BaseModel):
    status: str
    analysis_type: str
    confidence: str
    patterns: Dict[str, List[str]]
    recommendations: List[str]
    timestamp: str
    timeframe: str


class RealTimeSearchRequest(BaseModel):
    query: str = Field(..., min_length=1)


class RealTimeSearchResponse(BaseModel):
    status: str
    query: str
    results: str
    timestamp: str
    source_count: str
    pubmed_url: str


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        await connect_to_mongo()
    except DatabaseUnavailableError as exc:
        logger.warning("Starting API in degraded mode without MongoDB: %s", exc)
    yield
    await close_mongo_connection()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def user_repository(db: Optional[Any] = None) -> UserRepository:
    db = db if db is not None else get_database()
    return UserRepository(db.users, initial_credits=settings.initial_credits)


def analysis_repository(db: Optional[Any] = None) -> AnalysisRepository:
    db = db if db is not None else get_database()
    return AnalysisRepository(db.symptom_analyses)


async def initialize_indexes(db: Optional[Any] = None) -> None:
    db = db if db is not None else await connect_to_mongo()
    await user_repository(db).create_indexes()
    await analysis_repository(db).create_indexes()


async def _ensure_database_available(feature_name: str) -> Any:
    try:
        return get_database()
    except DatabaseUnavailableError:
        try:
            return await connect_to_mongo()
        except DatabaseUnavailableError as exc:
            raise HTTPException(
                status_code=503,
                detail=(
                    f"{feature_name} is temporarily unavailable because the database "
                    "connection is down."
                ),
            ) from exc


def _auth_header_to_user(authorization: Optional[str]) -> Dict[str, Any]:
    try:
        token = extract_bearer_token(authorization)
        decoded = decode_access_token(token)
        return decoded
    except AuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


async def _get_current_user_document(authorization: Optional[str]) -> Dict[str, Any]:
    decoded = _auth_header_to_user(authorization)
    db = await _ensure_database_available("Authentication")
    repo = user_repository(db)
    user_doc = await repo.get_by_user_id(str(decoded["sub"]))
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found.")
    return user_doc


def _current_user_response(user_doc: Dict[str, Any]) -> CurrentUserResponse:
    return CurrentUserResponse(
        user_id=str(user_doc.get("user_id", "")),
        google_sub=str(user_doc.get("google_sub", "")),
        email=str(user_doc.get("email", "")),
        name=str(user_doc.get("name", "")),
        picture=str(user_doc.get("picture", "")),
        credits_remaining=int(user_doc.get("credits_remaining", 0)),
        created_at=str(user_doc.get("created_at", "")),
        updated_at=str(user_doc.get("updated_at", "")),
    )


@app.get("/api/health")
async def health_check() -> Dict[str, Any]:
    database_health = get_database_health()
    is_healthy = bool(database_health.get("available"))
    return {
        "status": "healthy" if is_healthy else "degraded",
        "service": settings.app_name,
        "database_available": is_healthy,
        "database_error": database_health.get("error"),
        "google_auth_enabled": settings.google_auth_enabled,
        "credit_limit": settings.initial_credits,
        "pubmed_enabled": settings.pubmed_enabled,
        "degraded_features": []
        if is_healthy
        else [
            "Authentication-backed features are unavailable until MongoDB reconnects.",
            "History, dashboard, chat context, and credit tracking require the database.",
        ],
    }


@app.post("/api/auth/google", response_model=AuthTokens)
async def google_auth_login(request: GoogleAuthRequest) -> AuthTokens:
    try:
        profile = verify_google_id_token(request.id_token)
        db = await _ensure_database_available("Google sign-in")
        repo = user_repository(db)
        user_doc = await repo.create_or_update_google_user(
            google_sub=profile.google_sub,
            email=str(profile.email),
            name=profile.name,
            picture=profile.picture,
            given_name=profile.given_name,
            family_name=profile.family_name,
        )
        return build_auth_response(user_doc)
    except AuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Google auth login failed")
        raise HTTPException(
            status_code=500, detail=f"Authentication error: {exc}"
        ) from exc


@app.get("/api/auth/me", response_model=CurrentUserResponse)
async def get_me(
    authorization: Optional[str] = Header(default=None),
) -> CurrentUserResponse:
    user_doc = await _get_current_user_document(authorization)
    return _current_user_response(user_doc)


@app.get("/api/credits", response_model=CreditSummary)
async def get_credits(
    authorization: Optional[str] = Header(default=None),
) -> CreditSummary:
    user_doc = await _get_current_user_document(authorization)
    db = await _ensure_database_available("Credits")
    summary = await user_repository(db).get_credit_summary(str(user_doc["user_id"]))
    return CreditSummary(**summary)


@app.post("/api/analyze-symptom", response_model=HealthResponse)
async def analyze_symptom(
    request: SymptomRequest,
    authorization: Optional[str] = Header(default=None),
) -> HealthResponse:
    user_doc = await _get_current_user_document(authorization)
    db = await _ensure_database_available("Symptom analysis")
    users = user_repository(db)
    analyses = analysis_repository(db)

    credits_before = int(user_doc.get("credits_remaining", 0))
    if credits_before <= 0:
        raise HTTPException(
            status_code=403,
            detail=f"You have used all {settings.initial_credits} credits available on this account.",
        )

    request_payload = request.model_dump()
    research_payload = get_pubmed_research(
        symptom=request.symptom,
        age=request.age,
        gender=request.gender,
        medical_history=request.medical_history,
        max_results=settings.pubmed_max_results,
    )
    research_text = format_research_digest(request.symptom, research_payload)
    response_payload = build_analysis_response(request_payload, research_text)

    try:
        await analyses.create_analysis_with_credit_charge(
            user_repository=users,
            user_id=str(user_doc["user_id"]),
            request_payload=request_payload,
            response_payload=response_payload,
        )
    except ValueError as exc:
        detail = str(exc)
        status_code = 401 if detail == "User not found" else 403
        raise HTTPException(status_code=status_code, detail=detail) from exc
    except AnalysisPersistenceError as exc:
        logger.exception("Durable symptom analysis workflow failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return HealthResponse(**response_payload)


@app.get("/api/history", response_model=List[AnalysisHistoryItem])
async def get_history(
    authorization: Optional[str] = Header(default=None),
) -> List[AnalysisHistoryItem]:
    user_doc = await _get_current_user_document(authorization)
    db = await _ensure_database_available("History")
    records = await analysis_repository(db).list_user_analyses(
        str(user_doc["user_id"]),
        limit=settings.max_analysis_history,
    )

    items: List[AnalysisHistoryItem] = []
    for item in records:
        items.append(
            AnalysisHistoryItem(
                id=str(item.get("_id", item.get("created_at", ""))),
                symptom=str(item.get("symptom", "")),
                severity=str(item.get("severity_label", "")),
                duration=str(item.get("duration", "")),
                created_at=str(item.get("created_at", "")),
                risk_assessment=dict(
                    item.get("response_payload", {}).get("risk_assessment", {})
                ),
            )
        )
    return items


@app.post("/api/ai-chat", response_model=ChatResponse)
async def ai_health_chat(
    request: ChatMessage,
    authorization: Optional[str] = Header(default=None),
) -> ChatResponse:
    user_doc = await _get_current_user_document(authorization)
    db = await _ensure_database_available("AI chat")
    recent = await analysis_repository(db).get_recent_symptoms(
        str(user_doc["user_id"]), limit=5
    )
    payload = build_chat_response(request.message, recent_records=recent)
    return ChatResponse(**payload)


@app.get("/api/health-dashboard/{user_id}", response_model=HealthDashboard)
async def get_health_dashboard(
    user_id: str,
    authorization: Optional[str] = Header(default=None),
) -> HealthDashboard:
    user_doc = await _get_current_user_document(authorization)
    if str(user_doc.get("user_id")) != user_id:
        raise HTTPException(
            status_code=403, detail="You can only access your own dashboard."
        )

    db = await _ensure_database_available("Dashboard")
    dashboard = await analysis_repository(db).build_dashboard(user_id)
    return HealthDashboard(**dashboard)


@app.post("/api/voice-input")
async def process_voice_input(
    request: VoiceInput,
    authorization: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    await _get_current_user_document(authorization)
    return build_voice_response(request.audio_text, request.confidence)


@app.post("/api/real-time-search", response_model=RealTimeSearchResponse)
async def real_time_medical_search(
    request: RealTimeSearchRequest,
    authorization: Optional[str] = Header(default=None),
) -> RealTimeSearchResponse:
    await _get_current_user_document(authorization)

    research_payload = get_pubmed_research(
        symptom=request.query,
        max_results=settings.pubmed_max_results,
    )
    results_text = format_research_digest(request.query, research_payload)
    source_count = str(len(research_payload.get("results", [])))
    query = str(research_payload.get("query") or request.query)

    return RealTimeSearchResponse(
        status="success",
        query=request.query,
        results=results_text,
        timestamp=response_timestamp(),
        source_count=f"{source_count} PubMed summary result(s)",
        pubmed_url=build_pubmed_search_url(query),
    )


@app.post("/api/pattern-analysis", response_model=PatternAnalysisResponse)
async def ai_pattern_analysis(
    data: Dict[str, Any],
    authorization: Optional[str] = Header(default=None),
) -> PatternAnalysisResponse:
    user_doc = await _get_current_user_document(authorization)
    timeframe = str(data.get("timeframe", "month"))
    db = await _ensure_database_available("Pattern analysis")
    result = await analysis_repository(db).build_pattern_analysis(
        str(user_doc["user_id"]),
        timeframe=timeframe,
    )
    return PatternAnalysisResponse(**result)


def response_timestamp() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=settings.api_host, port=settings.api_port)
