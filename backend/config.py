import os
from dataclasses import dataclass
from pathlib import Path


def _load_backend_env() -> None:
    env_path = Path(__file__).with_name(".env")
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def _to_int(value: str | None, default: int) -> int:
    try:
        return int(value) if value is not None and value != "" else default
    except ValueError:
        return default


_load_backend_env()


@dataclass(frozen=True)
class Settings:
    app_name: str = "Smart Health Advisor AI"
    app_version: str = "1.0.0"

    api_host: str = os.getenv("API_HOST", "0.0.0.0")
    api_port: int = _to_int(os.getenv("PORT") or os.getenv("API_PORT"), 10000)

    cors_allow_origins_raw: str = os.getenv(
        "CORS_ALLOW_ORIGINS",
        "https://your-frontend.vercel.app",
    )

    mongo_url: str = os.getenv("MONGO_URL", "")
    mongo_database: str = "smart_health_advisor_ai"
    mongo_server_selection_timeout_ms: int = 5000

    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")

    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 10080

    initial_credits: int = 5
    max_analysis_history: int = 50

    pubmed_base_url: str = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
    pubmed_tool_name: str = "smart-health-advisor-ai"
    pubmed_email: str = ""
    pubmed_timeout_seconds: int = 12
    pubmed_max_results: int = 5

    @property
    def cors_allow_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_allow_origins_raw.split(",")
            if origin.strip()
        ]

    @property
    def google_auth_enabled(self) -> bool:
        return bool(self.google_client_id)

    @property
    def pubmed_enabled(self) -> bool:
        return True


settings = Settings()
