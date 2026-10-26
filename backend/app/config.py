"""Runtime configuration, read from environment variables / .env."""
from datetime import date

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "CaseLink API"
    # SQLite for the demo; use e.g. postgresql+psycopg://user:pass@db:5432/caselink in production
    database_url: str = "sqlite:///./caselink.db"
    jwt_secret: str = "change-me-in-production-use-32+-random-bytes"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    seed_on_startup: bool = True
    # The prototype dataset is frozen at this date so numbers match the frontend demo.
    # Leave empty to use the real current date.
    demo_today: str = "2026-10-23"
    # Overlap tiers (illustrative defaults; to be calibrated on labelled cases)
    tier_a_threshold: int = 80
    tier_b_threshold: int = 60
    sla_warning_days: int = 7

    @property
    def today(self) -> date:
        return date.fromisoformat(self.demo_today) if self.demo_today else date.today()

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
