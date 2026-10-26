from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import Base, SessionLocal, engine
from .routers import alerts, auth, cases, institutions, overlaps, reports
from .seed import seed
from .services.alerts import refresh_alerts


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    if settings.seed_on_startup:
        with SessionLocal() as db:
            if seed(db):
                refresh_alerts(db)
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description=(
        "Integrated Dashboard for Monitoring and Tracking Institution-Related Complaint Cases "
        "Across AICTE Bureaus/Cells. **Prototype: all data is synthetic. Not connected to any AICTE system.** "
        "Overlap scores are suggestions; an authorised officer records every final decision."
    ),
    lifespan=lifespan,
)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_list, allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

for r in (auth, institutions, cases, overlaps, alerts, reports):
    app.include_router(r.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "service": settings.app_name, "asOf": settings.today.isoformat(), "data": "synthetic"}
