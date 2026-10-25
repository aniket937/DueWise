import os
from pathlib import Path
from dotenv import load_dotenv

# Load backend/.env if it exists
backend_dir = Path(__file__).resolve().parent.parent.parent
env_file = backend_dir / ".env"
if env_file.exists():
    load_dotenv(dotenv_path=env_file)
else:
    load_dotenv()

# Resolve persistent absolute SQLite database path
raw_db_url = os.getenv("DATABASE_URL", "").strip()
if not raw_db_url or "sqlite" in raw_db_url:
    # Check if existing deadlinesloth.db or duewise.db
    legacy_db = backend_dir / "data" / "deadlinesloth.db"
    new_db = backend_dir / "data" / "duewise.db"
    active_db = new_db if not legacy_db.exists() else legacy_db
    db_file_path = active_db.resolve().as_posix()
    resolved_db_url = f"sqlite+aiosqlite:///{db_file_path}"
else:
    resolved_db_url = raw_db_url

class Settings:
    PROJECT_NAME: str = "DueWise"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # OpenRouter AI Configuration
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "").strip()
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct").strip()
    OPENROUTER_BASE_URL: str = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1").rstrip("/")
    OPENROUTER_HTTP_REFERER: str = os.getenv("OPENROUTER_HTTP_REFERER", "http://localhost:3000")
    OPENROUTER_APP_NAME: str = os.getenv("OPENROUTER_APP_NAME", "DueWise")

    # Database (Robust across working directories)
    DATABASE_URL: str = resolved_db_url

    # Frontend CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Upload limits
    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "15"))

    # Paths
    BASE_DIR: Path = backend_dir
    DATA_DIR: Path = backend_dir / "data"
    STORAGE_DIR: Path = backend_dir / "storage"

settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
