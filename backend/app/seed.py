"""Load the SYNTHETIC demo dataset (same data as the frontend prototype).

No real complaint, institution or officer is represented here.
"""
import json
from pathlib import Path

from sqlalchemy.orm import Session

from .models import Alert, Case, CaseAction, Institution, Overlap, User
from .security import hash_password
from .services.overlap import tier_for

DATA = Path(__file__).parent / "seed_data.json"

DEMO_USERS = [
    ("rb@aicte-demo.org", "RB Officer", "Demo RB Officer"),
    ("pgrc@aicte-demo.org", "PGRC Officer", "Demo PGRC Officer"),
    ("regional@aicte-demo.org", "Regional Office Official", "Demo Regional Official"),
    ("senior@aicte-demo.org", "Senior Management", "Demo Senior Management"),
    ("admin@aicte-demo.org", "Administrator", "Demo Administrator"),
]


def seed(db: Session) -> bool:
    """Seed once. Returns False if data already exists."""
    if db.query(Institution).count() > 0:
        return False
    d = json.loads(DATA.read_text(encoding="utf-8"))

    pw = hash_password("password")
    for email, role, name in DEMO_USERS:
        db.add(User(email=email, role=role, name=name, password_hash=pw))

    for i in d["institutions"]:
        db.add(Institution(**i))
    db.flush()

    for c in d["cases"]:
        case = Case(
            id=c["id"], institution_id=c["institutionId"], category=c["category"], source=c["source"],
            received_date=c["receivedDate"], status=c["status"], bureau=c["bureau"], officer=c["officer"],
            last_action=c["lastAction"], last_action_date=c["lastActionDate"], next_action=c["nextAction"],
            due_date=c["dueDate"], description=c["description"],
        )
        db.add(case)
        db.flush()
        db.add(CaseAction(case_id=c["id"], date=c["receivedDate"], title="Complaint registered",
                          by="Complaints Desk", remarks=f"Registered under {c['category']}."))
        db.add(CaseAction(case_id=c["id"], date=c["receivedDate"], title=f"Assigned to {c['bureau']}",
                          by="System (routing rule v1.2)", remarks=f"Officer: {c['officer']}."))
        if c["lastActionDate"] != c["receivedDate"]:
            db.add(CaseAction(case_id=c["id"], date=c["lastActionDate"], title=c["lastAction"],
                              by=c["officer"], remarks=f"Next action: {c['nextAction']}."))

    for o in d["overlaps"]:
        db.add(Overlap(
            id=o["id"], institution_id=o["institutionId"], case_a=o["caseIds"][0], case_b=o["caseIds"][1],
            similarity=o["similarity"], tier=tier_for(o["similarity"]), detected_on=o["detectedOn"],
            status=o["status"], reasons=o["reasons"], differences=o["differences"],
        ))

    for a in d["alerts"]:
        db.add(Alert(id=a["id"], type=a["type"], severity=a["severity"], case_id=a["caseId"],
                     message=a["message"], date=a["date"]))
    db.commit()
    return True
