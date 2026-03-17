from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus

import requests

from backend.config import settings

logger = logging.getLogger(__name__)


class PubMedIntegrationError(Exception):
    """Raised when PubMed integration fails in a non-recoverable way."""


def build_pubmed_query(
    symptom: str,
    age: Optional[int] = None,
    gender: Optional[str] = None,
    medical_history: Optional[str] = None,
) -> str:
    """
    Build a conservative PubMed query focused on symptom, nutrition, and management.

    The goal is to retrieve recent literature relevant to symptom-oriented,
    educational guidance without making unsupported diagnostic claims.
    """
    terms: List[str] = [symptom.strip()]

    if age is not None:
        if age < 18:
            terms.append("pediatric OR adolescent")
        elif age >= 65:
            terms.append("older adults OR elderly")
        else:
            terms.append("adults")

    if gender:
        normalized_gender = gender.strip().lower()
        if normalized_gender in {"male", "female"}:
            terms.append(normalized_gender)

    if medical_history:
        trimmed_history = medical_history.strip()
        if trimmed_history:
            terms.append(trimmed_history)

    terms.extend(
        [
            "nutrition OR diet OR lifestyle",
            "management OR treatment",
            "systematic review OR clinical trial OR guideline",
        ]
    )

    return " AND ".join(f"({term})" for term in terms if term)


def _request_json(url: str, params: Dict[str, Any]) -> Dict[str, Any]:
    response = requests.get(url, params=params, timeout=settings.pubmed_timeout_seconds)
    response.raise_for_status()
    return response.json()


def _pubmed_endpoint(path: str) -> str:
    base_url = settings.pubmed_base_url.rstrip("/")
    return f"{base_url}/{path.lstrip('/')}"


def _with_pubmed_metadata(params: Dict[str, Any]) -> Dict[str, Any]:
    enriched = dict(params)
    if settings.pubmed_tool_name:
        enriched["tool"] = settings.pubmed_tool_name
    if settings.pubmed_email:
        enriched["email"] = settings.pubmed_email
    return enriched


def search_pubmed_ids(
    query: str,
    max_results: int = 5,
    api_key: Optional[str] = None,
) -> List[str]:
    """
    Search PubMed and return article IDs.

    Uses NCBI E-utilities without requiring an API key.
    """
    clamped_max_results = max(1, min(max_results, settings.pubmed_max_results))
    params: Dict[str, Any] = {
        "db": "pubmed",
        "term": query,
        "retmode": "json",
        "retmax": clamped_max_results,
        "sort": "relevance",
    }
    if api_key:
        params["api_key"] = api_key

    payload = _request_json(
        _pubmed_endpoint("esearch.fcgi"),
        _with_pubmed_metadata(params),
    )
    return payload.get("esearchresult", {}).get("idlist", [])


def fetch_pubmed_summaries(
    pubmed_ids: List[str],
    api_key: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Fetch article summaries for a list of PubMed IDs.
    """
    if not pubmed_ids:
        return []

    params: Dict[str, Any] = {
        "db": "pubmed",
        "id": ",".join(pubmed_ids),
        "retmode": "json",
    }
    if api_key:
        params["api_key"] = api_key

    payload = _request_json(
        _pubmed_endpoint("esummary.fcgi"),
        _with_pubmed_metadata(params),
    )
    result = payload.get("result", {})
    summaries: List[Dict[str, Any]] = []

    for article_id in pubmed_ids:
        raw_item = result.get(article_id)
        if not raw_item:
            continue

        title = raw_item.get("title", "Untitled article")
        pubdate = raw_item.get("pubdate", "Unknown date")
        source = (
            raw_item.get("fulljournalname")
            or raw_item.get("source")
            or "Unknown journal"
        )
        authors = [
            author.get("name", "")
            for author in raw_item.get("authors", [])
            if isinstance(author, dict) and author.get("name")
        ]

        summaries.append(
            {
                "pubmed_id": article_id,
                "title": title,
                "pubdate": pubdate,
                "journal": source,
                "authors": authors,
                "url": f"https://pubmed.ncbi.nlm.nih.gov/{article_id}/",
            }
        )

    return summaries


def get_pubmed_research(
    symptom: str,
    age: Optional[int] = None,
    gender: Optional[str] = None,
    medical_history: Optional[str] = None,
    max_results: int = 5,
    api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Execute a PubMed search workflow and return normalized structured results.

    Returns a dict with:
    - query
    - results
    - source
    - success
    - error
    """
    try:
        query = build_pubmed_query(
            symptom=symptom,
            age=age,
            gender=gender,
            medical_history=medical_history,
        )
        pubmed_ids = search_pubmed_ids(
            query=query, max_results=max_results, api_key=api_key
        )
        summaries = fetch_pubmed_summaries(pubmed_ids=pubmed_ids, api_key=api_key)

        return {
            "success": True,
            "source": "PubMed",
            "query": query,
            "results": summaries,
            "error": None,
        }
    except requests.RequestException as exc:
        logger.warning("PubMed request failed: %s", exc)
        return {
            "success": False,
            "source": "PubMed",
            "query": symptom,
            "results": [],
            "error": "Unable to reach PubMed at the moment.",
        }
    except Exception as exc:
        logger.exception("Unexpected PubMed integration failure")
        return {
            "success": False,
            "source": "PubMed",
            "query": symptom,
            "results": [],
            "error": f"Unexpected PubMed integration error: {exc}",
        }


def format_research_digest(
    symptom: str,
    research_payload: Dict[str, Any],
) -> str:
    """
    Convert structured PubMed search results into a user-facing digest string.
    """
    if not research_payload.get("success"):
        error_message = (
            research_payload.get("error") or "Research data is currently unavailable."
        )
        return (
            f"Live medical literature search for {symptom.title()} is currently unavailable.\n\n"
            f"Reason: {error_message}\n"
            "You can still use the symptom analysis, but verify important decisions with a clinician because this research section is degraded."
        )

    results: List[Dict[str, Any]] = research_payload.get("results", [])
    if not results:
        return (
            f"No directly relevant recent PubMed summaries were found for {symptom.title()}.\n\n"
            "Try broadening the symptom wording or consult a healthcare professional for personalized advice."
        )

    lines: List[str] = [
        f"PubMed literature highlights for {symptom.title()}:",
        "",
    ]

    for index, item in enumerate(results, start=1):
        title = item.get("title", "Untitled article")
        journal = item.get("journal", "Unknown journal")
        pubdate = item.get("pubdate", "Unknown date")
        url = item.get("url", "")
        authors = item.get("authors", [])
        author_text = ", ".join(authors[:3]) if authors else "Authors not listed"

        lines.extend(
            [
                f"{index}. {title}",
                f"   Journal: {journal}",
                f"   Publication date: {pubdate}",
                f"   Authors: {author_text}",
                f"   Link: {url}",
                "",
            ]
        )

    lines.append(
        "These sources are provided for educational context and should not replace professional medical evaluation."
    )
    return "\n".join(lines)


def build_pubmed_search_url(query: str) -> str:
    """
    Build a browser-friendly PubMed URL for the query.
    """
    return f"https://pubmed.ncbi.nlm.nih.gov/?term={quote_plus(query)}"
