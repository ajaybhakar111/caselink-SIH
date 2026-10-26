# CaseLink

**Integrated Dashboard for Monitoring and Tracking Institution-Related Complaint Cases Across AICTE Bureaus/Cells**
Smart India Hackathon 2026 · Software

One institution, one consolidated view. CaseLink brings complaint cases from every AICTE Bureau/Cell
into a single window, flags **potential overlaps** with plain-language reasons, and leaves every final
decision to an authorised officer.

> Prototype with **synthetic data only**. Not connected to any AICTE system.

## Repository

```
frontend/   React + Vite dashboard (login, dashboard, cases, institution profile, overlaps, alerts, reports)
backend/    FastAPI REST API (auth/RBAC, routing, overlap engine, alerts, reports, audit trail)
docs/       Git commands and notes
docker-compose.yml   Backend + PostgreSQL
```

## Run locally

Backend (terminal 1):
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload                       # http://localhost:8000/docs
```

Frontend (terminal 2):
```bash
cd frontend
npm install
npm run dev                                         # http://localhost:5173
```

The UI currently runs on bundled mock data (`frontend/src/data/mockData.js`). `frontend/src/api.js` is a
ready client for the backend (`VITE_API_URL`, default `http://localhost:8000`).

## Key ideas
- Institution-centric registry with a verified-institution gate
- Rule-based routing with manual triage for ambiguous complaints
- Explainable overlap detection (topic, text similarity, keywords, timing) with tiers A/B/C
- Human verdict (confirm / reject / further review) recorded in an append-only audit trail
- SLA, overdue and escalation alerts; role-based access with masked cross-Bureau view

## Team
Add team name, problem statement ID and members here.
