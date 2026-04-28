"""Runtime configuration loaded from environment variables."""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    """Application settings.

    Values come from environment variables (and the repo-root .env file
    in local development). All have safe defaults for `uv run` use.
    """

    model_config = SettingsConfigDict(
        env_file=str(REPO_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    secret_key: str = Field(
        default="dev-secret-change-me",
        description="Used to sign session cookies.",
    )
    db_path: Path = Field(default=BACKEND_ROOT / "dev.db")
    wipe_db: bool = Field(
        default=False,
        description="If true, delete db_path on startup before init.",
    )
    static_dir: Path | None = Field(
        default=None,
        description="If set, mount this directory as the SPA at '/'.",
    )
    session_cookie_name: str = "session"
    session_max_age_seconds: int = 7 * 24 * 60 * 60


settings = Settings()
