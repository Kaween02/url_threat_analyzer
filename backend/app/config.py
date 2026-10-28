import json
import os
import time
from pathlib import Path

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parents[2]
_DOTENV_LOADED = load_dotenv(_ROOT / ".env")
_IN_DOCKER = Path("/.dockerenv").exists()
_POSTGRES_DEFAULT = "postgresql+psycopg://url_analyzer:replace-this-password@localhost:5432/url_threat_analyzer"
_SQLITE_URL = "sqlite:///" + (_ROOT / "backend" / "local.db").as_posix()

if _IN_DOCKER:
    DATABASE_URL = os.getenv("DATABASE_URL", _POSTGRES_DEFAULT)
else:
    # Host-side uvicorn cannot use Docker hostname `db`, and the local Postgres
    # on :5432 rejects this app's url_analyzer user. Use a local SQLite file.
    DATABASE_URL = _SQLITE_URL

JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-change-me-before-deploying")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
CORS_ORIGINS = [x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if x.strip()]

# #region agent log
try:
    from sqlalchemy.engine.url import make_url
    _u = make_url(DATABASE_URL)
    _root = Path(__file__).resolve().parents[2]
    with (_root / "debug-9805b2.log").open("a", encoding="utf-8") as _f:
        _f.write(json.dumps({
            "sessionId": "9805b2",
            "runId": "post-fix",
            "hypothesisId": "A",
            "location": "backend/app/config.py",
            "message": "resolved DATABASE_URL parts",
            "data": {
                "env_database_url_set": bool(os.getenv("DATABASE_URL")),
                "env_file_exists": (_root / ".env").exists(),
                "user": _u.username,
                "host": _u.host,
                "port": _u.port,
                "database": _u.database,
                "cwd": os.getcwd(),
                "dotenv_loaded": bool(_DOTENV_LOADED),
                "in_docker": _IN_DOCKER,
                "driver": _u.drivername,
            },
            "timestamp": int(time.time() * 1000),
        }) + "\n")
except Exception as _e:
    _root = Path(__file__).resolve().parents[2]
    with (_root / "debug-9805b2.log").open("a", encoding="utf-8") as _f:
        _f.write(json.dumps({
            "sessionId": "9805b2",
            "runId": "post-fix",
            "hypothesisId": "A",
            "location": "backend/app/config.py",
            "message": "failed to log DATABASE_URL parts",
            "data": {"error_type": type(_e).__name__},
            "timestamp": int(time.time() * 1000),
        }) + "\n")
# #endregion
