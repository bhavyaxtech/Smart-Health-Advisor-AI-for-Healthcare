import os
from dataclasses import dataclass


def _to_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "Smart Health Advisor AI")
    app_version: str = os.getenv("APP_VERSION", "1.0.0")
    environment: str = os.getenv("ENVIRONMENT", "development")
    debug: bool = _to_bool(os.getenv("DEBUG"), default=True)

    api_host: str = os.getenv("API_HOST", "0.0.0.0")
    api_port: int = int(os.getenv("API_PORT", "8001"))

    cors_allow_origins_raw: str = os.getenv("CORS_ALLOW_ORIGINS", "*")

    mongo_url: str = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    mongo_database: str = os.getenv("MONGO_DATABASE", "smart_health_advisor_ai")
    mongo_server_selection_timeout_ms: int = int(
        os.getenv("MONGO_SERVER_SELECTION_TIMEOUT_MS", "5000")
    )

    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")

    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_expiration_minutes: int = int(os.getenv("JWT_EXPIRATION_MINUTES", "10080"))

    initial_credits: int = int(os.getenv("INITIAL_CREDITS", "5"))
    max_analysis_history: int = int(os.getenv("MAX_ANALYSIS_HISTORY", "50"))

    pubmed_base_url: str = os.getenv(
        "PUBMED_BASE_URL",
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils",
    )
    pubmed_tool_name: str = os.getenv("PUBMED_TOOL_NAME", "smart-health-advisor-ai")
    pubmed_email: str = os.getenv("PUBMED_EMAIL", "")
    pubmed_timeout_seconds: int = int(os.getenv("PUBMED_TIMEOUT_SECONDS", "12"))
    pubmed_max_results: int = int(os.getenv("PUBMED_MAX_RESULTS", "5"))

    @property
    def cors_allow_origins(self) -> list[str]:
        raw = self.cors_allow_origins_raw.strip()
        if not raw or raw == "*":
            return ["*"]
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    @property
    def cors_allow_credentials(self) -> bool:
        return "*" not in self.cors_allow_origins

    @property
    def google_auth_enabled(self) -> bool:
        return bool(self.google_client_id)

    @property
    def pubmed_enabled(self) -> bool:
        return bool(self.pubmed_base_url.strip())


settings = Settings()
