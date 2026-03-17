from fastapi.testclient import TestClient

from backend import server
from backend.repositories import AnalysisPersistenceError


class FakeAnalysisRepository:
    def __init__(self):
        self.durable_calls = []
        self.history_records = [
            {
                "_id": "analysis-1",
                "symptom": "headache",
                "severity_label": "moderate",
                "duration": "2 days",
                "created_at": "2026-03-17T10:00:00+00:00",
                "response_payload": {
                    "risk_assessment": {
                        "immediate_risk": "Low",
                    }
                },
            }
        ]
        self.dashboard_payload = {
            "user_id": "user-123",
            "symptom_trends": [],
            "health_score": 82,
            "risk_factors": ["Moderate recurring symptoms."],
            "improvement_areas": ["Track triggers consistently."],
            "ai_recommendations": ["Review recurring headaches with a clinician."],
        }
        self.pattern_payload = {
            "status": "success",
            "analysis_type": "History Pattern Analysis",
            "confidence": "Medium",
            "patterns": {
                "recurring_patterns": ["headache appears 2 time(s)."],
                "trigger_identification": ["Stress may be relevant."],
                "improvement_trends": ["Recent symptom trend appears stable."],
                "ai_predictions": ["More logs improve pattern confidence."],
                "personalized_insights": ["You have 2 stored records."],
            },
            "recommendations": ["Keep logging duration and severity."],
            "timestamp": "2026-03-17T10:00:00+00:00",
            "timeframe": "month",
        }
        self.raise_on_create = None

    async def create_analysis_with_credit_charge(self, **kwargs):
        self.durable_calls.append(kwargs)
        if self.raise_on_create:
            raise self.raise_on_create
        return {"stored": True}

    async def list_user_analyses(self, user_id: str, limit: int = 20):
        del user_id, limit
        return self.history_records

    async def get_recent_symptoms(self, user_id: str, limit: int = 10):
        del user_id, limit
        return [{"symptom": "headache", "severity": "moderate"}]

    async def build_dashboard(self, user_id: str):
        del user_id
        return self.dashboard_payload

    async def build_pattern_analysis(self, user_id: str, timeframe: str = "month"):
        del user_id
        payload = dict(self.pattern_payload)
        payload["timeframe"] = timeframe
        return payload


class FakeUserRepository:
    def __init__(self):
        self.credit_summary = {
            "user_id": "user-123",
            "email": "test@example.com",
            "name": "Test User",
            "picture": "",
            "credits_total": 5,
            "credits_used": 1,
            "credits_remaining": 4,
            "has_credits": True,
            "is_active": True,
        }

    async def get_credit_summary(self, user_id: str):
        del user_id
        return self.credit_summary


def create_client(monkeypatch, *, database_available=True, database_error=None):
    async def fake_connect():
        return {"db": "ok"}

    async def fake_close():
        return None

    async def fake_initialize_indexes(db=None):
        del db
        return None

    monkeypatch.setattr(server, "connect_to_mongo", fake_connect)
    monkeypatch.setattr(server, "close_mongo_connection", fake_close)
    monkeypatch.setattr(server, "initialize_indexes", fake_initialize_indexes)
    monkeypatch.setattr(
        server,
        "get_database_health",
        lambda: {
            "available": database_available,
            "database": "smart_health_advisor_ai",
            "error": database_error,
        },
    )

    return TestClient(server.app)


def stub_authenticated_user(monkeypatch, credits_remaining=5):
    async def fake_get_current_user_document(_authorization):
        return {
            "user_id": "user-123",
            "email": "test@example.com",
            "name": "Test User",
            "credits_remaining": credits_remaining,
        }

    async def fake_ensure_database_available(_feature_name):
        return {"db": "ok"}

    monkeypatch.setattr(
        server,
        "_get_current_user_document",
        fake_get_current_user_document,
    )
    monkeypatch.setattr(
        server,
        "_ensure_database_available",
        fake_ensure_database_available,
    )


def test_health_reports_degraded_database(monkeypatch):
    with create_client(
        monkeypatch,
        database_available=False,
        database_error="MongoDB is unavailable",
    ) as client:
        response = client.get("/api/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "degraded"
    assert payload["database_available"] is False
    assert payload["database_error"] == "MongoDB is unavailable"
    assert payload["pubmed_enabled"] is True
    assert payload["degraded_features"]


def test_credits_requires_authentication(monkeypatch):
    with create_client(monkeypatch) as client:
        response = client.get("/api/credits")

    assert response.status_code == 401
    assert "Authorization" in response.json()["detail"]


def test_analyze_symptom_uses_durable_persistence_workflow(monkeypatch):
    fake_user_repo = FakeUserRepository()
    fake_analysis_repo = FakeAnalysisRepository()

    stub_authenticated_user(monkeypatch, credits_remaining=5)
    monkeypatch.setattr(server, "user_repository", lambda db=None: fake_user_repo)
    monkeypatch.setattr(
        server,
        "analysis_repository",
        lambda db=None: fake_analysis_repo,
    )
    monkeypatch.setattr(
        server,
        "get_pubmed_research",
        lambda **kwargs: {"success": True, "query": kwargs["symptom"], "results": []},
    )
    monkeypatch.setattr(
        server,
        "format_research_digest",
        lambda symptom, payload: f"Research digest for {symptom}: {payload['query']}",
    )

    with create_client(monkeypatch) as client:
        response = client.post(
            "/api/analyze-symptom",
            headers={"Authorization": "Bearer test-token"},
            json={
                "symptom": "headache",
                "duration": "1-3 days",
                "severity": "moderate",
                "additional_info": "Worse after skipping meals",
                "age": 34,
                "gender": "female",
                "medical_history": "Migraine history",
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["symptom_analysis"].startswith("Symptom reviewed: Headache")
    assert payload["ai_web_research"] == "Research digest for headache: headache"
    assert len(fake_analysis_repo.durable_calls) == 1
    stored_call = fake_analysis_repo.durable_calls[0]
    assert stored_call["user_repository"] is fake_user_repo
    assert stored_call["request_payload"]["symptom"] == "headache"


def test_analyze_symptom_rejects_users_without_credits(monkeypatch):
    stub_authenticated_user(monkeypatch, credits_remaining=0)
    monkeypatch.setattr(server, "user_repository", lambda db=None: FakeUserRepository())
    monkeypatch.setattr(
        server,
        "analysis_repository",
        lambda db=None: FakeAnalysisRepository(),
    )

    with create_client(monkeypatch) as client:
        response = client.post(
            "/api/analyze-symptom",
            headers={"Authorization": "Bearer test-token"},
            json={"symptom": "fatigue"},
        )

    assert response.status_code == 403
    assert "used all 5 credits" in response.json()["detail"]


def test_analyze_symptom_returns_reconciliation_error_on_failed_persist(monkeypatch):
    fake_analysis_repo = FakeAnalysisRepository()
    fake_analysis_repo.raise_on_create = AnalysisPersistenceError(
        "Analysis could not be saved, so your credit was restored automatically."
    )

    stub_authenticated_user(monkeypatch, credits_remaining=5)
    monkeypatch.setattr(server, "user_repository", lambda db=None: FakeUserRepository())
    monkeypatch.setattr(
        server,
        "analysis_repository",
        lambda db=None: fake_analysis_repo,
    )
    monkeypatch.setattr(
        server,
        "get_pubmed_research",
        lambda **kwargs: {"success": False, "query": kwargs["symptom"], "results": []},
    )
    monkeypatch.setattr(
        server,
        "format_research_digest",
        lambda symptom, payload: f"Research unavailable for {symptom}: {payload['query']}",
    )

    with create_client(monkeypatch) as client:
        response = client.post(
            "/api/analyze-symptom",
            headers={"Authorization": "Bearer test-token"},
            json={"symptom": "dizziness"},
        )

    assert response.status_code == 500
    assert "credit was restored automatically" in response.json()["detail"]


def test_history_dashboard_and_pattern_routes(monkeypatch):
    fake_user_repo = FakeUserRepository()
    fake_analysis_repo = FakeAnalysisRepository()

    stub_authenticated_user(monkeypatch, credits_remaining=4)
    monkeypatch.setattr(server, "user_repository", lambda db=None: fake_user_repo)
    monkeypatch.setattr(
        server,
        "analysis_repository",
        lambda db=None: fake_analysis_repo,
    )

    with create_client(monkeypatch) as client:
        history_response = client.get(
            "/api/history",
            headers={"Authorization": "Bearer test-token"},
        )
        dashboard_response = client.get(
            "/api/health-dashboard/user-123",
            headers={"Authorization": "Bearer test-token"},
        )
        pattern_response = client.post(
            "/api/pattern-analysis",
            headers={"Authorization": "Bearer test-token"},
            json={"timeframe": "month"},
        )

    assert history_response.status_code == 200
    history_payload = history_response.json()
    assert history_payload[0]["symptom"] == "headache"
    assert history_payload[0]["risk_assessment"]["immediate_risk"] == "Low"

    assert dashboard_response.status_code == 200
    assert dashboard_response.json()["health_score"] == 82

    assert pattern_response.status_code == 200
    assert pattern_response.json()["patterns"]["recurring_patterns"]


def test_realtime_search_degrades_gracefully_when_pubmed_is_unavailable(monkeypatch):
    stub_authenticated_user(monkeypatch, credits_remaining=4)
    monkeypatch.setattr(server, "user_repository", lambda db=None: FakeUserRepository())
    monkeypatch.setattr(
        server,
        "analysis_repository",
        lambda db=None: FakeAnalysisRepository(),
    )
    monkeypatch.setattr(
        server,
        "get_pubmed_research",
        lambda **kwargs: {
            "success": False,
            "query": kwargs["symptom"],
            "results": [],
            "error": "Unable to reach PubMed at the moment.",
        },
    )

    with create_client(monkeypatch) as client:
        response = client.post(
            "/api/real-time-search",
            headers={"Authorization": "Bearer test-token"},
            json={"query": "migraine nutrition"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert "currently unavailable" in payload["results"]
    assert payload["source_count"] == "0 PubMed summary result(s)"
