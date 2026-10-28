from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from .config import CORS_ORIGINS
from .database import Base, engine, get_db
from .models import User, Scan
from .schemas import SignupIn, LoginIn, AuthOut, UserOut, ScanIn, ScanOut
from .security import hash_password, verify_password, create_access_token, get_current_user
from .analyzer import analyze_url

# #region agent log
import json as _json
import time as _time
from pathlib import Path as _Path
_DEBUG_LOG = _Path(__file__).resolve().parents[2] / "debug-9805b2.log"

def _dbg(hypothesis_id, message, data):
    with _DEBUG_LOG.open("a", encoding="utf-8") as _f:
        _f.write(_json.dumps({
            "sessionId": "9805b2",
            "runId": "post-fix",
            "hypothesisId": hypothesis_id,
            "location": "backend/app/main.py:create_all",
            "message": message,
            "data": data,
            "timestamp": int(_time.time() * 1000),
        }) + "\n")

try:
    _dbg("E", "create_all starting", {
        "host": engine.url.host,
        "port": engine.url.port,
        "user": engine.url.username,
        "database": engine.url.database,
    })
    Base.metadata.create_all(bind=engine)
    _dbg("D", "create_all succeeded", {})
except Exception as _e:
    _dbg("C", "create_all failed", {"error_type": type(_e).__name__, "error": str(_e)[:400]})
    raise
# #endregion
app = FastAPI(title="URL Threat Analyzer API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.middleware("http")
async def _debug_log_http(request, call_next):
    response = await call_next(request)
    # #region agent log
    _dbg("F", "http response", {
        "path": request.url.path,
        "method": request.method,
        "status": response.status_code,
    })
    # #endregion
    return response

@app.get("/")
def root():
    return {"service": "URL Threat Analyzer API", "docs": "/docs", "health": "/health"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/auth/signup", response_model=AuthOut, status_code=201)
def signup(payload: SignupIn, db: Session = Depends(get_db)):
    email = str(payload.email).lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = User(name=payload.name.strip(), email=email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"access_token": create_access_token(user.id), "user": user}

@app.post("/api/auth/login", response_model=AuthOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    email = str(payload.email).lower()
    user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return {"access_token": create_access_token(user.id), "user": user}

@app.get("/api/auth/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user

@app.post("/api/scans", response_model=ScanOut, status_code=201)
def create_scan(payload: ScanIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        result = analyze_url(payload.url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    scan = Scan(user_id=user.id, url=payload.url.strip(), normalized_url=result["normalized_url"], risk=result["risk"], score=result["score"], explanation=result["explanation"], indicators="\n".join(result["indicators"]))
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan_to_out(scan)

@app.get("/api/scans", response_model=list[ScanOut])
def list_scans(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scans = db.scalars(select(Scan).where(Scan.user_id == user.id).order_by(desc(Scan.created_at)).limit(100)).all()
    return [scan_to_out(s) for s in scans]

@app.delete("/api/scans/{scan_id}", status_code=204)
def delete_scan(scan_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scan = db.scalar(select(Scan).where(Scan.id == scan_id, Scan.user_id == user.id))
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")
    db.delete(scan)
    db.commit()

@app.delete("/api/scans", status_code=204)
def clear_history(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.query(Scan).filter(Scan.user_id == user.id).delete(synchronize_session=False)
    db.commit()

def scan_to_out(scan: Scan):
    return {"id": scan.id, "url": scan.url, "risk": scan.risk, "score": scan.score, "explanation": scan.explanation, "indicators": [x for x in scan.indicators.splitlines() if x], "created_at": scan.created_at}
