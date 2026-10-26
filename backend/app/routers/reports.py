import csv
import io
import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Case, Institution, Overlap
from ..security import current_user
from ..services.common import BUREAUS, REGIONS, STATUSES, days_between, iso, is_overdue

router = APIRouter(tags=["reports"], dependencies=[Depends(current_user)])
SEED = Path(__file__).parent.parent / "seed_data.json"


def _rate(d: int, t: int) -> int:
    return round(d / t * 100) if t else 0


def _open(cases):
    return [c for c in cases if c.status != "Disposed"]


@router.get("/dashboard/summary")
def dashboard(db: Session = Depends(get_db)):
    cases = db.query(Case).all()
    by_status = {s: sum(c.status == s for c in cases) for s in STATUSES}
    ov = db.query(Overlap).all()
    return {
        "asOf": iso(),
        "total": len(cases),
        "byStatus": by_status,
        "overdue": sum(is_overdue(c) for c in cases),
        "overlapsPending": sum(o.status == "Pending Review" for o in ov),
        "byBureau": [
            {"bureau": b, "total": sum(c.bureau == b for c in cases),
             **{s: sum(c.bureau == b and c.status == s for c in cases) for s in STATUSES}}
            for b in BUREAUS
        ],
    }


def report_rows(name: str, db: Session) -> list[dict]:
    cases = db.query(Case).all()
    today = iso()
    if name == "bureau":
        rows = []
        for b in BUREAUS:
            lst = [c for c in cases if c.bureau == b]
            d = sum(c.status == "Disposed" for c in lst)
            rows.append({"Bureau": b, "Total": len(lst), **{s: sum(c.status == s for c in lst) for s in STATUSES},
                         "Overdue": sum(is_overdue(c) for c in lst), "Disposal rate": f"{_rate(d, len(lst))}%"})
        return rows
    if name == "region":
        rows = []
        for r in REGIONS:
            lst = [c for c in cases if c.institution.region == r]
            d = sum(c.status == "Disposed" for c in lst)
            rows.append({"Region": r, "Total": len(lst), "Open": len(_open(lst)),
                         "Overdue": sum(is_overdue(c) for c in lst), "Disposal rate": f"{_rate(d, len(lst))}%"})
        return rows
    if name == "institution":
        ovs = db.query(Overlap).all()
        rows = []
        for i in db.query(Institution).order_by(Institution.name).all():
            lst = [c for c in cases if c.institution_id == i.id]
            rows.append({"Institution": i.name, "Region": i.region, "Total": len(lst), "Open": len(_open(lst)),
                         "Overdue": sum(is_overdue(c) for c in lst),
                         "Bureaus involved": len({c.bureau for c in lst}),
                         "Overlaps": sum(o.institution_id == i.id for o in ovs)})
        return sorted(rows, key=lambda r: -r["Total"])
    if name == "ageing":
        buckets = [("0-30 days", 0, 30), ("31-60 days", 31, 60), ("61-90 days", 61, 90), ("90+ days", 91, 10**6)]
        op = _open(cases)
        return [{"Age of open cases": lab,
                 "Cases": sum(lo <= days_between(today, c.received_date) <= hi for c in op)} for lab, lo, hi in buckets]
    if name == "overlaps":
        ovs = db.query(Overlap).all()
        return [{"Status": s, "Count": sum(o.status == s for o in ovs)}
                for s in ("Pending Review", "Confirmed", "Rejected", "Further Review")]
    if name == "performance":
        rows = []
        for b in BUREAUS:
            lst = [c for c in cases if c.bureau == b]
            op = _open(lst)
            avg = round(sum(days_between(today, c.received_date) for c in op) / len(op)) if op else 0
            rows.append({"Bureau": b, "Open": len(op), "Average age of open (days)": avg,
                         "Overdue": sum(is_overdue(c) for c in lst)})
        return rows
    raise HTTPException(404, "Unknown report. Use: bureau, region, institution, ageing, overlaps, performance")


@router.get("/reports/trend")
def trend():
    """Monthly received vs disposed. SYNTHETIC illustrative series from the prototype dataset."""
    return json.loads(SEED.read_text(encoding="utf-8"))["monthly_trend"]


@router.get("/reports/{name}.csv", summary="CSV export")
def report_csv(name: str, db: Session = Depends(get_db)):
    rows = report_rows(name, db)
    buf = io.StringIO()
    if rows:
        w = csv.DictWriter(buf, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    buf.seek(0)
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
                             headers={"Content-Disposition": f'attachment; filename="caselink-{name}.csv"'})


@router.get("/reports/{name}")
def report(name: str, db: Session = Depends(get_db)):
    return report_rows(name, db)
