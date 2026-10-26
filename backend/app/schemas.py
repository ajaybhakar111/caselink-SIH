"""Pydantic schemas. Fields are exposed in camelCase to match the React frontend's mock data."""
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class Camel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class LoginIn(Camel):
    email: str
    password: str
    role: str | None = None


class TokenOut(Camel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str


class InstitutionOut(Camel):
    id: str
    name: str
    city: str
    state: str
    region: str
    type: str
    intake: int
    established: int
    address: str


class CaseOut(Camel):
    id: str
    institution_id: str
    category: str
    source: str
    received_date: str
    status: str
    bureau: str
    officer: str
    last_action: str
    last_action_date: str
    next_action: str
    due_date: str
    description: str
    overdue: bool = False
    has_overlap: bool = False


class CaseCreate(Camel):
    institution_id: str
    category: str
    source: str = "Student"
    description: str = Field(min_length=10)
    bureau: str | None = None  # if omitted, the routing rules recommend one


class CaseUpdate(Camel):
    status: str | None = None
    next_action: str | None = None
    last_action: str | None = None
    remarks: str = ""


class ActionOut(Camel):
    date: str
    title: str
    by: str
    remarks: str


class RoutingOut(Camel):
    recommended_bureau: str | None
    rule: str
    confidence: str  # "rule" or "manual-triage"
    note: str


class CaseCreated(Camel):
    case: CaseOut
    routing: RoutingOut
    overlap_suggestions: list[str] = []


class OverlapOut(Camel):
    id: str
    institution_id: str
    case_ids: list[str]
    similarity: int
    tier: str
    detected_on: str
    status: str
    reasons: list[str]
    differences: list[str]
    reviewed_by: str | None = None
    reviewed_on: str | None = None


class OverlapDecision(Camel):
    verdict: str = Field(description="Confirmed | Rejected | Further Review | Pending Review")
    remarks: str = ""


class AlertOut(Camel):
    id: str
    type: str
    severity: str
    case_id: str
    message: str
    date: str
    acknowledged: bool = False


class AuditOut(Camel):
    id: int
    ts: str
    actor: str
    role: str
    action: str
    entity: str
    entity_id: str
    detail: str
