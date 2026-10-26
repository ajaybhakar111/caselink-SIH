from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Alert, AuditLog
from ..schemas import AlertOut, AuditOut
from ..security import ACTORS, current_user, require_roles
from ..services.alerts import refresh_alerts
from ..services.common import audit

router = APIRouter(tags=["alerts"], dependencies=[Depends(current_user)])


@router.get("/alerts", response_model=list[AlertOut])
def list_alerts(type: str | None = None, severity: str | None = None, include_acknowledged: bool = True,
                db: Session = Depends(get_db)):
    q = db.query(Alert)
    if type:
        q = q.filter(Alert.type == type)
    if severity:
        q = q.filter(Alert.severity == severity)
    if not include_acknowledged:
        q = q.filter(Alert.acknowledged.is_(False))
    return q.order_by(Alert.date.desc(), Alert.id).all()


@router.post("/alerts/refresh", summary="Regenerate alerts from current case data")
def refresh(db: Session = Depends(get_db), user=Depends(require_roles(*ACTORS))):
    n = refresh_alerts(db)
    audit(db, user, "alerts.refresh", "alert", "-", f"created={n}")
    db.commit()
    return {"created": n}


@router.post("/alerts/{alert_id}/acknowledge", response_model=AlertOut)
def acknowledge(alert_id: str, db: Session = Depends(get_db), user=Depends(require_roles(*ACTORS))):
    a = db.get(Alert, alert_id)
    if a is None:
        raise HTTPException(404, "Alert not found")
    a.acknowledged, a.acknowledged_by = True, user.email
    audit(db, user, "alert.acknowledge", "alert", a.id)
    db.commit()
    return a


@router.get("/audit", response_model=list[AuditOut], summary="Append-only audit trail")
def audit_trail(entity: str | None = None, entity_id: str | None = None, limit: int = 100,
                db: Session = Depends(get_db), user=Depends(require_roles("Senior Management", "Administrator"))):
    q = db.query(AuditLog)
    if entity:
        q = q.filter(AuditLog.entity == entity)
    if entity_id:
        q = q.filter(AuditLog.entity_id == entity_id)
    rows = q.order_by(AuditLog.id.desc()).limit(min(limit, 500)).all()
    return [AuditOut(id=r.id, ts=r.ts.isoformat(), actor=r.actor, role=r.role, action=r.action,
                     entity=r.entity, entity_id=r.entity_id, detail=r.detail) for r in rows]
