from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Case, Overlap
from ..schemas import OverlapDecision, OverlapOut
from ..security import REVIEWERS, current_user, mask_case, require_roles
from ..services import overlap as ov
from ..services.common import audit, iso
from ..services.alerts import refresh_alerts
from .cases import case_out, _next_overlap_id

router = APIRouter(prefix="/overlaps", tags=["overlaps"])
VERDICTS = {"Confirmed", "Rejected", "Further Review", "Pending Review"}


def overlap_out(o: Overlap) -> OverlapOut:
    return OverlapOut(
        id=o.id, institution_id=o.institution_id, case_ids=[o.case_a, o.case_b], similarity=o.similarity,
        tier=o.tier, detected_on=o.detected_on, status=o.status, reasons=o.reasons,
        differences=o.differences, reviewed_by=o.reviewed_by, reviewed_on=o.reviewed_on,
    )


@router.get("")
def list_overlaps(status: str | None = None, tier: str | None = None, db: Session = Depends(get_db), user=Depends(current_user)):
    """Review queue. Each item includes both cases so the officer can compare them side by side."""
    query = db.query(Overlap)
    if status:
        query = query.filter(Overlap.status == status)
    if tier:
        query = query.filter(Overlap.tier == tier.upper())
    out = []
    for o in query.order_by(Overlap.similarity.desc()).all():
        a, b = db.get(Case, o.case_a), db.get(Case, o.case_b)
        item = overlap_out(o).model_dump(by_alias=True)
        item["cases"] = [mask_case(case_out(c, True).model_dump(by_alias=True), user.role) for c in (a, b)]
        item["institutionName"] = a.institution.name
        out.append(item)
    return out


@router.post("/{overlap_id}/decision", response_model=OverlapOut)
def decide(overlap_id: str, body: OverlapDecision, db: Session = Depends(get_db), user=Depends(require_roles(*REVIEWERS))):
    """Human-in-the-loop verdict. The system never merges or closes cases on its own."""
    o = db.get(Overlap, overlap_id)
    if o is None:
        raise HTTPException(404, "Overlap not found")
    if body.verdict not in VERDICTS:
        raise HTTPException(422, f"Verdict must be one of {sorted(VERDICTS)}")
    old = o.status
    o.status = body.verdict
    if body.verdict == "Pending Review":  # reopen
        o.reviewed_by = o.reviewed_on = None
    else:
        o.reviewed_by, o.reviewed_on = f"{user.role}", iso()
    audit(db, user, "overlap.decision", "overlap", o.id, f"{old} -> {body.verdict}. {body.remarks}".strip())
    db.commit()
    return overlap_out(o)


@router.post("/detect", summary="Scan all open cases and create new suggestions")
def detect(db: Session = Depends(get_db), user=Depends(require_roles(*REVIEWERS))):
    """Re-run the detector across all institutions. Existing pairs are not duplicated."""
    existing = {frozenset((o.case_a, o.case_b)) for o in db.query(Overlap).all()}
    cases = db.query(Case).filter(Case.status != "Disposed").all()
    created = []
    for i, a in enumerate(cases):
        for b in cases[i + 1:]:
            if not ov.passes_gate(a, b) or frozenset((a.id, b.id)) in existing:
                continue
            r = ov.score_pair(a, b)
            if r["tier"] not in ("A", "B"):
                continue
            oid = _next_overlap_id(db)
            db.add(Overlap(id=oid, institution_id=a.institution_id, case_a=a.id, case_b=b.id, similarity=r["score"],
                           tier=r["tier"], detected_on=iso(), status="Pending Review",
                           reasons=r["reasons"], differences=r["differences"]))
            db.flush()
            existing.add(frozenset((a.id, b.id)))
            created.append(oid)
    audit(db, user, "overlap.detect", "overlap", "-", f"created={created}")
    db.commit()
    refresh_alerts(db)
    return {"created": created, "count": len(created)}
