from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..models import Case, CaseAction, Institution, Overlap
from ..schemas import ActionOut, CaseCreate, CaseCreated, CaseOut, CaseUpdate, RoutingOut
from ..security import ACTORS, current_user, mask_case, require_roles
from ..services import overlap as ov
from ..services.common import BUREAUS, STATUSES, audit, case_ids_with_overlap, iso, is_overdue
from ..services.routing import recommend

router = APIRouter(prefix="/cases", tags=["cases"])
DEFAULT_SLA_DAYS = 45  # ASSUMPTION for the prototype; replace with AICTE's prescribed timeline


def case_out(c: Case, has_overlap: bool = False) -> CaseOut:
    out = CaseOut.model_validate(c)
    out.overdue = is_overdue(c)
    out.has_overlap = has_overlap
    return out


def _next_case_id(db: Session) -> str:
    n = db.query(Case).count() + 101
    while db.get(Case, f"CMP-2026-{n:04d}"):
        n += 1
    return f"CMP-2026-{n:04d}"


def _next_overlap_id(db: Session) -> str:
    n = db.query(Overlap).count() + 1
    while db.get(Overlap, f"OV-{n:03d}"):
        n += 1
    return f"OV-{n:03d}"


@router.get("")
def list_cases(
    q: str | None = Query(None, description="Search case ID, description or institution name"),
    status: str | None = None,
    bureau: str | None = None,
    category: str | None = None,
    institution_id: str | None = Query(None, alias="institutionId"),
    overdue: bool | None = None,
    overlap: bool | None = None,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    query = db.query(Case).join(Institution)
    if q:
        like = f"%{q}%"
        query = query.filter(Case.id.ilike(like) | Case.description.ilike(like) | Institution.name.ilike(like))
    if status:
        query = query.filter(Case.status == status)
    if bureau:
        query = query.filter(Case.bureau == bureau)
    if category:
        query = query.filter(Case.category == category)
    if institution_id:
        query = query.filter(Case.institution_id == institution_id)
    rows = query.order_by(Case.id).all()
    in_overlap = case_ids_with_overlap(db)
    items = [(c, c.id in in_overlap) for c in rows]
    if overdue is not None:
        items = [t for t in items if is_overdue(t[0]) == overdue]
    if overlap is not None:
        items = [t for t in items if t[1] == overlap]
    return [mask_case(case_out(c, o).model_dump(by_alias=True), user.role) for c, o in items]


@router.post("/route", response_model=RoutingOut, summary="Recommend a Bureau/Cell (does not create a case)")
def route_preview(category: str, description: str = "", _=Depends(current_user)):
    r = recommend(category, description)
    return RoutingOut(recommended_bureau=r.recommended_bureau, rule=r.rule, confidence=r.confidence, note=r.note)


@router.get("/{case_id}")
def case_detail(case_id: str, db: Session = Depends(get_db), user=Depends(current_user)):
    c = db.get(Case, case_id)
    if c is None:
        raise HTTPException(404, "Case not found")
    overlaps = db.query(Overlap).filter((Overlap.case_a == case_id) | (Overlap.case_b == case_id)).all()
    inst = c.institution
    return {
        "case": mask_case(case_out(c, any(o.status != "Rejected" for o in overlaps)).model_dump(by_alias=True), user.role),
        "institution": {"id": inst.id, "name": inst.name, "city": inst.city, "state": inst.state, "region": inst.region},
        "timeline": [ActionOut.model_validate(a).model_dump(by_alias=True) for a in c.actions],
        "overlapIds": [o.id for o in overlaps],
    }


@router.post("", response_model=CaseCreated, status_code=201)
def create_case(body: CaseCreate, db: Session = Depends(get_db), user=Depends(require_roles(*ACTORS))):
    """Register a complaint. Steps: verify institution -> route -> save -> overlap suggestions."""
    inst = db.get(Institution, body.institution_id)
    if inst is None:
        # Verified-institution gate: unknown IDs are never auto-created.
        raise HTTPException(422, "Institution not found. Send to the verify queue instead of guessing.")
    routing = recommend(body.category, body.description)
    bureau = body.bureau or routing.recommended_bureau
    if bureau is None:
        bureau = "Manual Triage"
    elif bureau not in BUREAUS and bureau != "Manual Triage":
        raise HTTPException(422, f"Unknown Bureau/Cell '{bureau}'")

    today = iso()
    case = Case(
        id=_next_case_id(db), institution_id=inst.id, category=body.category, source=body.source,
        received_date=today, status="Pending", bureau=bureau, officer="Unassigned",
        last_action="Complaint registered", last_action_date=today, next_action="Initial scrutiny",
        due_date=(settings.today + timedelta(days=DEFAULT_SLA_DAYS)).isoformat(),
        description=body.description,
    )
    db.add(case)
    db.flush()
    db.add(CaseAction(case_id=case.id, date=today, title="Complaint registered", by=user.email,
                      remarks=f"Registered under {body.category}."))
    db.add(CaseAction(case_id=case.id, date=today, title=f"Assigned to {bureau}",
                      by=f"System (routing rule {routing.rule})", remarks=routing.note))

    suggestions: list[str] = []
    others = db.query(Case).filter(Case.institution_id == inst.id).all()
    for other, r in ov.find_overlaps_for(case, others):
        oid = _next_overlap_id(db)
        db.add(Overlap(id=oid, institution_id=inst.id, case_a=other.id, case_b=case.id,
                       similarity=r["score"], tier=r["tier"], detected_on=today, status="Pending Review",
                       reasons=r["reasons"], differences=r["differences"]))
        db.flush()
        suggestions.append(oid)

    audit(db, user, "case.create", "case", case.id, f"bureau={bureau}; routing={routing.confidence}; overlaps={suggestions}")
    db.commit()
    return CaseCreated(case=case_out(case, bool(suggestions)), routing=RoutingOut(
        recommended_bureau=routing.recommended_bureau, rule=routing.rule,
        confidence=routing.confidence, note=routing.note), overlap_suggestions=suggestions)


@router.patch("/{case_id}", response_model=CaseOut)
def update_case(case_id: str, body: CaseUpdate, db: Session = Depends(get_db), user=Depends(require_roles(*ACTORS))):
    c = db.get(Case, case_id)
    if c is None:
        raise HTTPException(404, "Case not found")
    if user.role == "Regional Office Official" and c.bureau != "Regional Office":
        raise HTTPException(403, "You can only update cases assigned to the Regional Office")
    if body.status:
        if body.status not in STATUSES:
            raise HTTPException(422, f"Status must be one of {STATUSES}")
        c.status = body.status
    if body.next_action:
        c.next_action = body.next_action
    title = body.last_action or (f"Status changed to {c.status}" if body.status else "Case updated")
    c.last_action, c.last_action_date = title, iso()
    db.add(CaseAction(case_id=c.id, date=iso(), title=title, by=user.email, remarks=body.remarks))
    audit(db, user, "case.update", "case", c.id, f"status={c.status}; {body.remarks}")
    db.commit()
    return case_out(c)
