"""Alert generation: Overdue, SLA, Escalation, Overlap, Reminder.

`refresh_alerts` is idempotent: it creates alerts that do not exist yet (keyed by type+case)
and never deletes acknowledged ones. In production this runs as a scheduled Celery task.
"""
from datetime import date

from sqlalchemy.orm import Session

from ..config import settings
from ..models import Alert, Case, Overlap
from .common import days_between, iso, is_overdue


def _next_id(db: Session) -> str:
    n = db.query(Alert).count() + 1
    while db.get(Alert, f"AL-{n:02d}"):
        n += 1
    return f"AL-{n:02d}"


def refresh_alerts(db: Session) -> int:
    today = iso()
    existing = {(a.type, a.case_id) for a in db.query(Alert).all()}
    created = 0

    def add(type_: str, sev: str, case_id: str, msg: str):
        nonlocal created
        if (type_, case_id) in existing:
            return
        db.add(Alert(id=_next_id(db), type=type_, severity=sev, case_id=case_id, message=msg, date=today))
        db.flush()
        existing.add((type_, case_id))
        created += 1

    for c in db.query(Case).filter(Case.status != "Disposed").all():
        if is_overdue(c):
            late = days_between(today, c.due_date)
            add("Overdue", "High", c.id, f"Case is {late} days beyond the prescribed timeline.")
        else:
            left = (date.fromisoformat(c.due_date) - settings.today).days
            if left <= settings.sla_warning_days:
                add("SLA", "Medium", c.id, f"Due in {left} days. Next action: {c.next_action}.")
        if c.status == "Escalated":
            add("Escalation", "High", c.id, f"Escalated: {c.last_action}. Decision awaited.")
        if c.status == "Transferred":
            add("Reminder", "Low", c.id, f"Pending follow-up: {c.next_action}.")

    for o in db.query(Overlap).filter(Overlap.status == "Pending Review", Overlap.tier == "A").all():
        for cid in (o.case_a, o.case_b):
            other = o.case_b if cid == o.case_a else o.case_a
            add("Overlap", "High", cid, f"Potential overlap with {other}. Coordination required.")

    db.commit()
    return created
