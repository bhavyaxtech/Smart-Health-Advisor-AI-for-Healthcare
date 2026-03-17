from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import requests
from jose import JWTError, jwt
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from backend.config import settings

GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"
DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7
DEFAULT_INITIAL_CREDITS = 5


class AuthConfig(BaseModel):
    model_config = ConfigDict(frozen=True)

    jwt_secret: str = Field(default_factory=lambda: settings.jwt_secret_key)
    jwt_algorithm: str = Field(default_factory=lambda: settings.jwt_algorithm)
    access_token_expire_minutes: int = Field(
        default_factory=lambda: settings.jwt_expiration_minutes
    )
    google_client_id: str = Field(default_factory=lambda: settings.google_client_id)


class GoogleUserProfile(BaseModel):
    google_sub: str
    email: EmailStr
    email_verified: bool = False
    name: str = ""
    given_name: str = ""
    family_name: str = ""
    picture: str = ""


class AuthenticatedUser(BaseModel):
    user_id: str
    google_sub: str
    email: EmailStr
    name: str = ""
    picture: str = ""
    credits_remaining: int = DEFAULT_INITIAL_CREDITS
    created_at: str = ""
    updated_at: str = ""


class GoogleAuthRequest(BaseModel):
    id_token: str


class AuthTokens(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: AuthenticatedUser


class AuthError(Exception):
    pass


def get_auth_config() -> AuthConfig:
    return AuthConfig()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _iso_now() -> str:
    return _utcnow().isoformat()


def verify_google_id_token(
    id_token: str, config: Optional[AuthConfig] = None
) -> GoogleUserProfile:
    config = config or get_auth_config()

    if not id_token or not id_token.strip():
        raise AuthError("Google ID token is required.")

    if not config.google_client_id:
        raise AuthError(
            "Google authentication is not configured. GOOGLE_CLIENT_ID is missing."
        )

    try:
        response = requests.get(
            GOOGLE_TOKEN_INFO_URL,
            params={"id_token": id_token},
            timeout=10,
        )
    except requests.RequestException as exc:
        raise AuthError("Unable to reach Google token verification service.") from exc

    if response.status_code != 200:
        raise AuthError("Invalid Google ID token.")

    payload = response.json()

    audience = payload.get("aud")
    if audience != config.google_client_id:
        raise AuthError(
            "Google token audience does not match the configured client ID."
        )

    if payload.get("iss") not in {
        "accounts.google.com",
        "https://accounts.google.com",
    }:
        raise AuthError("Invalid Google token issuer.")

    if payload.get("email_verified") not in {"true", True, "True"}:
        raise AuthError("Google account email must be verified.")

    google_sub = payload.get("sub")
    email = payload.get("email")
    if not google_sub or not email:
        raise AuthError("Google token did not include required user identity fields.")

    return GoogleUserProfile(
        google_sub=google_sub,
        email=email,
        email_verified=True,
        name=payload.get("name", ""),
        given_name=payload.get("given_name", ""),
        family_name=payload.get("family_name", ""),
        picture=payload.get("picture", ""),
    )


def build_user_document(
    google_profile: GoogleUserProfile,
    existing_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    now = _iso_now()

    if existing_user:
        user_doc = dict(existing_user)
        user_doc["email"] = str(google_profile.email)
        user_doc["name"] = google_profile.name or user_doc.get("name", "")
        user_doc["picture"] = google_profile.picture or user_doc.get("picture", "")
        user_doc["updated_at"] = now
        user_doc["provider"] = "google"
        return user_doc

    return {
        "user_id": google_profile.google_sub,
        "google_sub": google_profile.google_sub,
        "email": str(google_profile.email),
        "name": google_profile.name,
        "given_name": google_profile.given_name,
        "family_name": google_profile.family_name,
        "picture": google_profile.picture,
        "provider": "google",
        "credits_remaining": DEFAULT_INITIAL_CREDITS,
        "created_at": now,
        "updated_at": now,
    }


def create_access_token(
    subject: str,
    email: str,
    config: Optional[AuthConfig] = None,
    additional_claims: Optional[Dict[str, Any]] = None,
) -> tuple[str, int]:
    config = config or get_auth_config()
    expires_delta = timedelta(minutes=config.access_token_expire_minutes)
    expire_at = _utcnow() + expires_delta

    payload: Dict[str, Any] = {
        "sub": subject,
        "email": email,
        "provider": "google",
        "exp": expire_at,
        "iat": _utcnow(),
    }

    if additional_claims:
        payload.update(additional_claims)

    token = jwt.encode(
        payload,
        config.jwt_secret,
        algorithm=config.jwt_algorithm,
    )
    return token, int(expires_delta.total_seconds())


def decode_access_token(
    token: str, config: Optional[AuthConfig] = None
) -> Dict[str, Any]:
    config = config or get_auth_config()

    if not token:
        raise AuthError("Access token is required.")

    try:
        payload = jwt.decode(
            token,
            config.jwt_secret,
            algorithms=[config.jwt_algorithm],
        )
    except JWTError as exc:
        raise AuthError("Invalid or expired access token.") from exc

    subject = payload.get("sub")
    email = payload.get("email")
    if not subject or not email:
        raise AuthError("Access token is missing required claims.")

    return payload


def extract_bearer_token(authorization_header: Optional[str]) -> str:
    if not authorization_header:
        raise AuthError("Authorization header is missing.")

    prefix = "Bearer "
    if not authorization_header.startswith(prefix):
        raise AuthError("Authorization header must use the Bearer scheme.")

    token = authorization_header[len(prefix) :].strip()
    if not token:
        raise AuthError("Bearer token is empty.")

    return token


def user_doc_to_model(user_doc: Dict[str, Any]) -> AuthenticatedUser:
    return AuthenticatedUser(
        user_id=str(user_doc.get("user_id") or user_doc.get("google_sub") or ""),
        google_sub=str(user_doc.get("google_sub") or ""),
        email=str(user_doc.get("email") or ""),
        name=str(user_doc.get("name") or ""),
        picture=str(user_doc.get("picture") or ""),
        credits_remaining=int(
            user_doc.get("credits_remaining", DEFAULT_INITIAL_CREDITS)
        ),
        created_at=str(user_doc.get("created_at") or ""),
        updated_at=str(user_doc.get("updated_at") or ""),
    )


def build_auth_response(
    user_doc: Dict[str, Any],
    config: Optional[AuthConfig] = None,
) -> AuthTokens:
    user = user_doc_to_model(user_doc)
    token, expires_in = create_access_token(
        subject=user.user_id,
        email=str(user.email),
        config=config,
        additional_claims={
            "google_sub": user.google_sub,
            "credits_remaining": user.credits_remaining,
            "name": user.name,
            "picture": user.picture,
        },
    )
    return AuthTokens(
        access_token=token,
        expires_in=expires_in,
        user=user,
    )


def ensure_user_has_credits(user_doc: Dict[str, Any]) -> None:
    credits_remaining = int(user_doc.get("credits_remaining", 0))
    if credits_remaining <= 0:
        raise AuthError("You have used all 5 credits available on this account.")


def decrement_user_credit(user_doc: Dict[str, Any]) -> Dict[str, Any]:
    credits_remaining = int(user_doc.get("credits_remaining", 0))
    if credits_remaining <= 0:
        raise AuthError("You have used all 5 credits available on this account.")

    updated = dict(user_doc)
    updated["credits_remaining"] = credits_remaining - 1
    updated["updated_at"] = _iso_now()
    return updated


def build_credit_summary(user_doc: Dict[str, Any]) -> Dict[str, Any]:
    total_credits = DEFAULT_INITIAL_CREDITS
    remaining = int(user_doc.get("credits_remaining", total_credits))
    used = total_credits - remaining
    return {
        "total_credits": total_credits,
        "credits_used": max(used, 0),
        "credits_remaining": max(remaining, 0),
        "has_credits": remaining > 0,
    }


def get_current_user_from_token(
    token: str,
    user_lookup: Optional[Dict[str, Any]] = None,
    config: Optional[AuthConfig] = None,
) -> Dict[str, Any]:
    payload = decode_access_token(token, config=config)

    if user_lookup is not None:
        return user_lookup

    return {
        "user_id": payload["sub"],
        "google_sub": payload.get("google_sub", payload["sub"]),
        "email": payload["email"],
        "name": payload.get("name", ""),
        "picture": payload.get("picture", ""),
        "credits_remaining": int(
            payload.get("credits_remaining", DEFAULT_INITIAL_CREDITS)
        ),
        "created_at": "",
        "updated_at": "",
    }


__all__ = [
    "AuthenticatedUser",
    "AuthConfig",
    "AuthError",
    "AuthTokens",
    "DEFAULT_INITIAL_CREDITS",
    "GoogleAuthRequest",
    "GoogleUserProfile",
    "build_auth_response",
    "build_credit_summary",
    "build_user_document",
    "create_access_token",
    "decode_access_token",
    "decrement_user_credit",
    "ensure_user_has_credits",
    "extract_bearer_token",
    "get_auth_config",
    "get_current_user_from_token",
    "user_doc_to_model",
    "verify_google_id_token",
]
