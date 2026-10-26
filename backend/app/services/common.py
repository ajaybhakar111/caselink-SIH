from datetime import date, datetime

from sqlalchemy.orm import Session

from ..config import settings
from ..models import AuditLog, Case, Overlap

BUREAUS = ["RB", "PGRC", "Approval Bureau", "Regional Office"]
STATUSES = ["Pending", "Under Process", "Disposed", "Transferred", "Escalated"]
REGIONS = ["Northern", "Southern", "Eastern", "Western", "Central"]


def iso(d: date | datetime | None = None) -> str:
    return (d or settings.today).isoformat()[:10]


def is_overdue(case: Case) -> bool:
    return case.status != "Disposed" and date.fromisoformat(case.due_date) < settings.today


def days_between(a: str, b: str) -> int:
    return (date.fromisoformat(a) - date.fromisoformat(b)).days


def audit(db: Session, user, action: str, entity: str, entity_id: str, detail: str = "") -> None:
    """Append one row to the audit log. Never updated or deleted."""
    db.add(AuditLog(actor=user.email, role=user.role, action=action, entity=entity, entity_id=entity_id, detail=detail))


def case_ids_with_overlap(db: Session) -> set[str]:
    ids: set[str] = set()
    for o in db.query(Overlap).filter(Overlap.status != "Rejected").all():
        ids.update([o.case_a, o.case_b])
    return ids
