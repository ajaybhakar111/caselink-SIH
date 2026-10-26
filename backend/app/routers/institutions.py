from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Case, Institution, Overlap
from ..schemas import CaseOut, InstitutionOut
from ..security import current_user, mask_case
from ..services.common import is_overdue
from .cases import case_out

router = APIRouter(prefix="/institutions", tags=["institutions"], dependencies=[Depends(current_user)])


@router.get("", response_model=list[InstitutionOut])
def list_institutions(q: str | None = Query(None, description="Search by name or ID"), db: Session = Depends(get_db)):
    query = db.query(Institution)
    if q:
        like = f"%{q}%"
        query = query.filter(Institution.name.ilike(like) | Institution.id.ilike(like))
    return query.order_by(Institution.name).all()


@router.get("/{inst_id}")
def institution_profile(inst_id: str, db: Session = Depends(get_db), user=Depends(current_user)):
    """Single window for one institution: details, all cases across Bureaus, overlaps, and totals."""
    inst = db.get(Institution, inst_id)
    if inst is None:
        raise HTTPException(404, "Institution not found")
    cases = db.query(Case).filter(Case.institution_id == inst_id).order_by(Case.received_date).all()
    overlaps = db.query(Overlap).filter(Overlap.institution_id == inst_id).all()
    in_overlap = {c for o in overlaps if o.status != "Rejected" for c in (o.case_a, o.case_b)}
    outs = [mask_case(case_out(c, c.id in in_overlap).model_dump(by_alias=True), user.role) for c in cases]
    return {
        "institution": InstitutionOut.model_validate(inst).model_dump(by_alias=True),
        "cases": outs,
        "bureausInvolved": sorted({c.bureau for c in cases}),
        "totals": {
            "total": len(cases),
            "open": sum(c.status != "Disposed" for c in cases),
            "overdue": sum(is_overdue(c) for c in cases),
            "overlaps": len(overlaps),
        },
        "overlapIds": [o.id for o in overlaps],
    }
