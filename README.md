# URL Threat Analyzer

A full-stack starter project using Next.js App Router, React, TypeScript, FastAPI, SQLAlchemy, and PostgreSQL.

## Features
- Responsive navy-and-white dashboard
- Login and signup screens
- JWT-based API authentication
- Per-user private scan history and delete/clear actions
- URL analysis endpoint with explainable **prototype heuristics**
- Docker Compose for PostgreSQL, API, and frontend

> **Security note:** The current analyzer is a prototype heuristic, not a trained AI model or a reputation-provider integration. A “Safe” result means no current heuristic indicators were found; it does not guarantee safety. Do not use this prototype as a production phishing blocker without independent evaluation, provider integrations, rate limiting, monitoring, and a security review.

## Requirements
- Docker Desktop, or Node.js 20+ / npm, Python 3.11+, and PostgreSQL 15+

## Run with Docker
1. Copy `.env.example` to `.env`.
2. Change `JWT_SECRET` to a long random secret.
3. From this folder run:
   ```bash
   docker compose up --build
   ```
4. Open http://localhost:3000

The API is at http://localhost:8000 and interactive docs at http://localhost:8000/docs.

## Run locally without Docker
### API
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
# Set DATABASE_URL and JWT_SECRET in your environment (see .env.example)
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `frontend/.env.local`.

## API routes
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/scans`
- `GET /api/scans`
- `DELETE /api/scans/{scan_id}`
- `DELETE /api/scans` (clear current user's history only)
- `GET /health`

All scan/history routes require a bearer token. Database queries are scoped to the authenticated user's ID.

## Before production
- Use HTTPS and a managed secret store.
- Add email verification, password reset, account lockout, rate limiting, CSRF strategy if switching to cookies, and audit logging.
- Add a reputable URL threat-intelligence provider and/or a properly trained/evaluated classifier.
- If fetching target pages is added later, implement SSRF protections (block private/reserved IPs, revalidate redirects, cap time/bytes, isolate workers).
- Configure CORS to the exact deployed frontend origin.
