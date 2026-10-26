# CaseLink Backend (FastAPI)

REST API for **CaseLink**, the Integrated Dashboard for Monitoring and Tracking Institution-Related
Complaint Cases Across AICTE Bureaus/Cells.

> **Prototype notice.** All data is synthetic. This API is not connected to any AICTE system.
> Overlap scores are suggestions, never proof. Routing rules and the 45-day default SLA are
> illustrative until AICTE confirms its own.

## Quick start

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open http://localhost:8000/docs for interactive API docs. The database (SQLite) is created and
seeded on first start. Run the tests with `python -m pytest`.

Demo logins (password `password` for all):

| Role | Email |
|---|---|
| RB Officer | rb@aicte-demo.org |
| PGRC Officer | pgrc@aicte-demo.org |
| Regional Office Official | regional@aicte-demo.org |
| Senior Management | senior@aicte-demo.org |
| Administrator | admin@aicte-demo.org |

## What it implements

| Area | Endpoints | Notes |
|---|---|---|
| Auth + RBAC | `POST /auth/login`, `GET /auth/me`, `GET /auth/roles` | JWT; roles enforced on the server |
| Institutions | `GET /institutions`, `GET /institutions/{id}` | One-window profile across all Bureaus |
| Cases | `GET/POST /cases`, `GET/PATCH /cases/{id}`, `POST /cases/route` | Verified-institution gate, rule routing, manual triage |
| Overlaps | `GET /overlaps`, `POST /overlaps/{id}/decision`, `POST /overlaps/detect` | Human verdict; every decision audited |
| Alerts | `GET /alerts`, `POST /alerts/refresh`, `POST /alerts/{id}/acknowledge` | Overdue, SLA, Escalation, Overlap, Reminder |
| Reports | `GET /dashboard/summary`, `GET /reports/{name}`, `GET /reports/{name}.csv` | bureau, region, institution, ageing, overlaps, performance |
| Audit | `GET /audit` | Append-only; Senior Management and Administrator only |

## Design notes

- **Overlap engine** (`app/services/overlap.py`): gate (same institution, different Bureau, both open),
  then a weighted score of category match, TF-IDF cosine similarity, shared keywords and time proximity,
  then tiers A/B/C with human-readable reasons and differences. Upgrade path: swap the text similarity
  for multilingual sentence embeddings stored in PostgreSQL + pgvector.
- **Routing** (`app/services/routing.py`): versioned category rules; multi-issue or unknown complaints
  go to manual triage instead of being guessed.
- **Human in control**: nothing is merged or closed automatically.
- **Masked cross-Bureau view**: a Regional Office official sees officer and description only for
  cases owned by the Regional Office.
- **Database**: SQLite by default. Set `DATABASE_URL=postgresql+psycopg://...` (and install `psycopg`)
  for PostgreSQL, or use `docker compose up` from the repo root.

## Layout

```
backend/
  app/
    main.py  config.py  db.py  models.py  schemas.py  security.py  seed.py  seed_data.json
    routers/   auth, institutions, cases, overlaps, alerts, reports
    services/  routing, overlap, alerts, common
  tests/       14 tests (API, RBAC, routing, similarity)
  Dockerfile  requirements.txt  .env.example
```

## Not built yet (honest list)

Real AICTE data integration, SSO, document upload, background scheduler for alerts (Celery),
embedding-based similarity, migrations (Alembic), and calibration of thresholds on labelled data.
