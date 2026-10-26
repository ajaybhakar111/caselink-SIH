from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    email: Mapped[str] = mapped_column(String(120), primary_key=True)
    role: Mapped[str] = mapped_column(String(60))
    name: Mapped[str] = mapped_column(String(120), default="")
    password_hash: Mapped[str] = mapped_column(String(200))


class Institution(Base):
    __tablename__ = "institutions"
    id: Mapped[str] = mapped_column(String(20), primary_key=True)  # AICTE permanent ID (synthetic here)
    name: Mapped[str] = mapped_column(String(200), index=True)
    city: Mapped[str] = mapped_column(String(80))
    state: Mapped[str] = mapped_column(String(80))
    region: Mapped[str] = mapped_column(String(30), index=True)
    type: Mapped[str] = mapped_column(String(40))
    intake: Mapped[int] = mapped_column(Integer)
    established: Mapped[int] = mapped_column(Integer)
    address: Mapped[str] = mapped_column(String(250))
    cases: Mapped[list["Case"]] = relationship(back_populates="institution")


class Case(Base):
    __tablename__ = "cases"
    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id"), index=True)
    category: Mapped[str] = mapped_column(String(60), index=True)
    source: Mapped[str] = mapped_column(String(30))
    received_date: Mapped[str] = mapped_column(String(10))
    status: Mapped[str] = mapped_column(String(30), index=True)
    bureau: Mapped[str] = mapped_column(String(40), index=True)
    officer: Mapped[str] = mapped_column(String(80))
    last_action: Mapped[str] = mapped_column(String(200))
    last_action_date: Mapped[str] = mapped_column(String(10))
    next_action: Mapped[str] = mapped_column(String(200))
    due_date: Mapped[str] = mapped_column(String(10))
    description: Mapped[str] = mapped_column(Text)
    institution: Mapped[Institution] = relationship(back_populates="cases")
    actions: Mapped[list["CaseAction"]] = relationship(
        back_populates="case", cascade="all, delete-orphan", order_by="CaseAction.id"
    )


class CaseAction(Base):
    __tablename__ = "case_actions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), index=True)
    date: Mapped[str] = mapped_column(String(10))
    title: Mapped[str] = mapped_column(String(200))
    by: Mapped[str] = mapped_column(String(120))
    remarks: Mapped[str] = mapped_column(Text, default="")
    case: Mapped[Case] = relationship(back_populates="actions")


class Overlap(Base):
    __tablename__ = "overlaps"
    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id"), index=True)
    case_a: Mapped[str] = mapped_column(ForeignKey("cases.id"))
    case_b: Mapped[str] = mapped_column(ForeignKey("cases.id"))
    similarity: Mapped[int] = mapped_column(Integer)
    tier: Mapped[str] = mapped_column(String(1), default="A")
    detected_on: Mapped[str] = mapped_column(String(10))
    status: Mapped[str] = mapped_column(String(30), default="Pending Review", index=True)
    reasons: Mapped[list] = mapped_column(JSON, default=list)
    differences: Mapped[list] = mapped_column(JSON, default=list)
    reviewed_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    reviewed_on: Mapped[str | None] = mapped_column(String(10), nullable=True)


class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    type: Mapped[str] = mapped_column(String(20), index=True)
    severity: Mapped[str] = mapped_column(String(10))
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), index=True)
    message: Mapped[str] = mapped_column(String(300))
    date: Mapped[str] = mapped_column(String(10))
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    acknowledged_by: Mapped[str | None] = mapped_column(String(120), nullable=True)


class AuditLog(Base):
    """Append-only: the API exposes no update or delete for this table."""
    __tablename__ = "audit_log"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    actor: Mapped[str] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(60))
    action: Mapped[str] = mapped_column(String(60))
    entity: Mapped[str] = mapped_column(String(30))
    entity_id: Mapped[str] = mapped_column(String(30))
    detail: Mapped[str] = mapped_column(Text, default="")
