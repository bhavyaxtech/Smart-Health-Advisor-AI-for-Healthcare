from __future__ import annotations

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional

from pymongo import ReturnDocument

from backend.services.analysis import severity_label_to_score


logger = logging.getLogger(__name__)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(dt: Optional[datetime] = None) -> str:
    value = dt or utc_now()
    return value.astimezone(timezone.utc).isoformat()


class AnalysisPersistenceError(RuntimeError):
    """Raised when credit charging and analysis persistence cannot be reconciled."""


class UserRepository:
    def __init__(self, collection: Any, initial_credits: int = 5) -> None:
        self.collection = collection
        self.initial_credits = initial_credits

    async def create_indexes(self) -> None:
        await self.collection.create_index("user_id", unique=True)
        await self.collection.create_index("google_sub", unique=True)
        await self.collection.create_index("email", unique=True)
        await self.collection.create_index("created_at")

    async def get_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"user_id": user_id})

    async def get_by_google_sub(self, google_sub: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"google_sub": google_sub})

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"email": email.lower().strip()})

    async def create_or_update_google_user(
        self,
        *,
        google_sub: str,
        email: str,
        name: str,
        picture: str = "",
        given_name: str = "",
        family_name: str = "",
    ) -> Dict[str, Any]:
        normalized_email = email.lower().strip()
        now_iso = to_iso()

        existing = await self.collection.find_one(
            {
                "$or": [
                    {"google_sub": google_sub},
                    {"email": normalized_email},
                ]
            }
        )

        if existing:
            credits_total = int(existing.get("credits_total", self.initial_credits))
            credits_remaining = int(
                existing.get("credits_remaining", credits_total)
            )
            await self.collection.update_one(
                {"_id": existing["_id"]},
                {
                    "$set": {
                        "user_id": google_sub,
                        "google_sub": google_sub,
                        "email": normalized_email,
                        "name": name,
                        "given_name": given_name,
                        "family_name": family_name,
                        "picture": picture,
                        "provider": "google",
                        "credits_total": credits_total,
                        "credits_remaining": credits_remaining,
                        "updated_at": now_iso,
                        "last_login_at": now_iso,
                        "is_active": True,
                    },
                },
            )
            refreshed = await self.collection.find_one({"_id": existing["_id"]})
            if refreshed is None:
                raise ValueError("Failed to reload updated user.")
            return refreshed

        user_doc = {
            "user_id": google_sub,
            "google_sub": google_sub,
            "email": normalized_email,
            "name": name,
            "given_name": given_name,
            "family_name": family_name,
            "picture": picture,
            "provider": "google",
            "credits_total": self.initial_credits,
            "credits_remaining": self.initial_credits,
            "created_at": now_iso,
            "updated_at": now_iso,
            "last_login_at": now_iso,
            "is_active": True,
        }
        await self.collection.insert_one(user_doc)
        return user_doc

    async def decrement_credit(self, user_id: str) -> Dict[str, Any]:
        updated_user, _, _ = await self.consume_credit(user_id)
        return updated_user

    async def consume_credit(self, user_id: str) -> tuple[Dict[str, Any], int, int]:
        updated_at = to_iso()
        updated_user = await self.collection.find_one_and_update(
            {
                "user_id": user_id,
                "credits_remaining": {"$gt": 0},
            },
            {
                "$inc": {"credits_remaining": -1},
                "$set": {"updated_at": updated_at},
            },
            return_document=ReturnDocument.AFTER,
        )

        if updated_user is None:
            existing_user = await self.get_by_user_id(user_id)
            if not existing_user:
                raise ValueError("User not found")
            raise ValueError("No credits remaining")

        credits_after = int(updated_user.get("credits_remaining", 0))
        credits_before = credits_after + 1
        return updated_user, credits_before, credits_after

    async def restore_credit(
        self,
        user_id: str,
        *,
        expected_credits_remaining: Optional[int] = None,
    ) -> bool:
        filter_query: Dict[str, Any] = {"user_id": user_id}
        if expected_credits_remaining is not None:
            filter_query["credits_remaining"] = expected_credits_remaining

        updated_user = await self.collection.find_one_and_update(
            filter_query,
            {
                "$inc": {"credits_remaining": 1},
                "$set": {"updated_at": to_iso()},
            },
            return_document=ReturnDocument.AFTER,
        )
        return updated_user is not None

    async def get_credit_summary(self, user_id: str) -> Dict[str, Any]:
        user = await self.get_by_user_id(user_id)
        if not user:
            raise ValueError("User not found")

        total = int(user.get("credits_total", self.initial_credits))
        remaining = int(user.get("credits_remaining", 0))
        used = max(total - remaining, 0)

        return {
            "user_id": user["user_id"],
            "email": user.get("email", ""),
            "name": user.get("name", ""),
            "picture": user.get("picture", ""),
            "credits_total": total,
            "credits_used": used,
            "credits_remaining": remaining,
            "has_credits": remaining > 0,
            "is_active": bool(user.get("is_active", True)),
        }


class AnalysisRepository:
    def __init__(self, collection: Any) -> None:
        self.collection = collection

    async def create_indexes(self) -> None:
        await self.collection.create_index("user_id")
        await self.collection.create_index("created_at")
        await self.collection.create_index([("user_id", 1), ("created_at", -1)])

    async def create_analysis(
        self,
        *,
        user_id: str,
        request_payload: Dict[str, Any],
        response_payload: Dict[str, Any],
        credits_before: Optional[int] = None,
        credits_after: Optional[int] = None,
    ) -> Dict[str, Any]:
        document = self._build_analysis_document(
            user_id=user_id,
            request_payload=request_payload,
            response_payload=response_payload,
            credits_before=credits_before,
            credits_after=credits_after,
        )
        result = await self.collection.insert_one(document)
        created = await self.collection.find_one({"_id": result.inserted_id})
        if created is None:
            raise ValueError("Failed to persist analysis.")
        return created

    async def create_analysis_with_credit_charge(
        self,
        *,
        user_repository: UserRepository,
        user_id: str,
        request_payload: Dict[str, Any],
        response_payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        updated_user, credits_before, credits_after = await user_repository.consume_credit(
            user_id
        )

        try:
            return await self.create_analysis(
                user_id=user_id,
                request_payload=request_payload,
                response_payload=response_payload,
                credits_before=credits_before,
                credits_after=credits_after,
            )
        except Exception as exc:
            rollback_success = await user_repository.restore_credit(
                user_id,
                expected_credits_remaining=credits_after,
            )
            if not rollback_success:
                logger.exception(
                    "Analysis persistence failed and credit rollback did not reconcile for user %s",
                    user_id,
                )
                raise AnalysisPersistenceError(
                    "Analysis could not be saved and the credit rollback did not complete. "
                    "Manual account review is required."
                ) from exc

            raise AnalysisPersistenceError(
                "Analysis could not be saved, so your credit was restored automatically."
            ) from exc

    async def list_user_analyses(
        self,
        user_id: str,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        cursor = (
            self.collection.find({"user_id": user_id})
            .sort("created_at", -1)
            .limit(limit)
        )
        return await cursor.to_list(length=limit)

    async def get_recent_symptoms(
        self,
        user_id: str,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        analyses = await self.list_user_analyses(user_id, limit=limit)
        return [
            {
                "symptom": item.get("symptom", ""),
                "severity": item.get("severity_label", ""),
                "severity_score": item.get("severity_score", 0),
                "duration": item.get("duration", ""),
                "timestamp": item.get("created_at", ""),
            }
            for item in analyses
        ]

    async def build_dashboard(self, user_id: str) -> Dict[str, Any]:
        analyses = await self.list_user_analyses(user_id, limit=50)

        if not analyses:
            return {
                "user_id": user_id,
                "symptom_trends": [],
                "health_score": 100,
                "risk_factors": [
                    "No symptom history yet. Submit an analysis to generate insights."
                ],
                "improvement_areas": [
                    "Use your remaining credits carefully for the most important symptoms."
                ],
                "ai_recommendations": [
                    "Track severity and duration consistently for better trend analysis.",
                    "Seek care promptly if severe or worsening symptoms occur.",
                ],
            }

        trend_items: List[Dict[str, Any]] = []
        severity_scores: List[int] = []
        symptom_counts: Dict[str, int] = {}

        for item in analyses[:14]:
            symptom = str(item.get("symptom", "")).strip()
            score = int(item.get("severity_score", 0))
            severity_scores.append(score)

            if symptom:
                key = symptom.lower()
                symptom_counts[key] = symptom_counts.get(key, 0) + 1

            trend_items.append(
                {
                    "date": item.get("created_at", ""),
                    "symptom": symptom,
                    "severity": score,
                    "severity_label": item.get("severity_label", ""),
                    "summary": self._extract_summary(item),
                }
            )

        avg_severity = sum(severity_scores) / max(len(severity_scores), 1)
        health_score = max(35, min(100, int(100 - (avg_severity * 7))))

        most_common_symptom = ""
        if symptom_counts:
            most_common_symptom = max(symptom_counts, key=symptom_counts.get)

        risk_factors: List[str] = []
        improvement_areas: List[str] = []
        recommendations: List[str] = []

        if avg_severity >= 7:
            risk_factors.append("Recent analyses show a high average severity level.")
            improvement_areas.append(
                "Seek professional evaluation for repeated high-severity symptoms."
            )
        elif avg_severity >= 4:
            risk_factors.append(
                "Symptoms show a moderate severity pattern over recent analyses."
            )
            improvement_areas.append(
                "Track triggers and note what improves or worsens symptoms."
            )
        else:
            risk_factors.append(
                "Recent symptoms trend mild overall, but continued monitoring is still useful."
            )
            improvement_areas.append(
                "Maintain healthy sleep, hydration, and nutrition habits."
            )

        if most_common_symptom:
            risk_factors.append(
                f"Most frequently analyzed symptom: {most_common_symptom}."
            )
            recommendations.append(
                f"Review patterns related to recurring {most_common_symptom} episodes."
            )

        recommendations.extend(
            [
                "Compare new symptoms with your recent analysis history before spending another credit.",
                "Record duration and associated triggers to improve future recommendations.",
                "Use red-flag guidance from each report to decide when to seek urgent care.",
            ]
        )

        return {
            "user_id": user_id,
            "symptom_trends": trend_items,
            "health_score": health_score,
            "risk_factors": risk_factors,
            "improvement_areas": improvement_areas,
            "ai_recommendations": recommendations,
        }

    async def build_pattern_analysis(
        self,
        user_id: str,
        timeframe: str = "month",
    ) -> Dict[str, Any]:
        analyses = await self.list_user_analyses(user_id, limit=50)

        if not analyses:
            return {
                "status": "success",
                "analysis_type": "History Pattern Analysis",
                "confidence": "Low",
                "patterns": {
                    "recurring_patterns": ["No history available yet."],
                    "trigger_identification": ["Not enough data to identify triggers."],
                    "improvement_trends": [
                        "Submit at least two analyses to compare change over time."
                    ],
                    "ai_predictions": [
                        "No prediction available without stored history."
                    ],
                    "personalized_insights": [
                        "Start building a symptom history to unlock pattern insights."
                    ],
                },
                "recommendations": [
                    "Complete additional analyses to generate personalized symptom patterns."
                ],
                "timestamp": to_iso(),
                "timeframe": timeframe,
            }

        symptom_counts: Dict[str, int] = {}
        severities: List[int] = []

        for item in analyses:
            symptom = str(item.get("symptom", "")).strip().lower()
            if symptom:
                symptom_counts[symptom] = symptom_counts.get(symptom, 0) + 1
            severities.append(int(item.get("severity_score", 0)))

        avg_severity = sum(severities) / max(len(severities), 1)

        sorted_counts = sorted(
            symptom_counts.items(),
            key=lambda pair: pair[1],
            reverse=True,
        )

        recurring = [
            f"{symptom} appears {count} time(s) in your recent analysis history."
            for symptom, count in sorted_counts[:3]
        ] or ["No recurring symptom pattern detected yet."]

        trend_direction = "stable"
        if len(severities) >= 6:
            recent = severities[:3]
            older = severities[3:6]
            recent_avg = sum(recent) / len(recent)
            older_avg = sum(older) / len(older)
            if recent_avg > older_avg + 0.5:
                trend_direction = "worsening"
            elif recent_avg < older_avg - 0.5:
                trend_direction = "improving"

        return {
            "status": "success",
            "analysis_type": "History Pattern Analysis",
            "confidence": "Medium" if len(analyses) < 5 else "High",
            "patterns": {
                "recurring_patterns": recurring,
                "trigger_identification": [
                    "Manual trigger tracking is not yet structured; use "
                    "additional notes for better insight extraction.",
                    "Severity and duration are currently the strongest pattern signals in your history.",
                ],
                "improvement_trends": [
                    f"Recent symptom trend appears {trend_direction}.",
                    f"Average recorded severity score: {avg_severity:.1f}/10.",
                ],
                "ai_predictions": [
                    "More consistent symptom logging will improve pattern confidence.",
                    "Recurring symptoms with moderate or severe scores should "
                    "be professionally evaluated if persistent.",
                ],
                "personalized_insights": [
                    f"You have {len(analyses)} stored analysis record(s).",
                    "Historical tracking is now influencing your dashboard and follow-up guidance.",
                ],
            },
            "recommendations": [
                "Include duration and context in every submission.",
                "Use the dashboard to review recent symptom frequency before your next analysis.",
                "Seek medical attention promptly if severe symptoms recur or worsen.",
            ],
            "timestamp": to_iso(),
            "timeframe": timeframe,
        }

    def _extract_summary(self, item: Dict[str, Any]) -> str:
        response_payload = item.get("response_payload", {})
        if isinstance(response_payload, dict):
            text = str(response_payload.get("symptom_analysis", "")).strip()
            if text:
                return text[:180] + ("..." if len(text) > 180 else "")
        return "No summary available."

    def _build_analysis_document(
        self,
        *,
        user_id: str,
        request_payload: Dict[str, Any],
        response_payload: Dict[str, Any],
        credits_before: Optional[int],
        credits_after: Optional[int],
    ) -> Dict[str, Any]:
        symptom = str(request_payload.get("symptom", "")).strip()
        severity_label = str(request_payload.get("severity", "")).strip().lower()

        return {
            "user_id": user_id,
            "symptom": symptom,
            "duration": str(request_payload.get("duration", "")).strip(),
            "severity_label": severity_label,
            "severity_score": severity_label_to_score(severity_label),
            "additional_info": str(request_payload.get("additional_info", "")).strip(),
            "age": request_payload.get("age"),
            "gender": str(request_payload.get("gender", "")).strip(),
            "medical_history": str(request_payload.get("medical_history", "")).strip(),
            "request_payload": request_payload,
            "response_payload": response_payload,
            "credit_cost": 1,
            "credits_before": credits_before,
            "credits_after": credits_after,
            "created_at": to_iso(),
        }
