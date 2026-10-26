from app.services import overlap as ov
from app.services.routing import recommend


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["data"] == "synthetic"


def test_auth_required(client):
    assert client.get("/cases").status_code == 401
    r = client.post("/auth/login", json={"email": "rb@aicte-demo.org", "password": "wrong"})
    assert r.status_code == 401


def test_dashboard_matches_prototype(client, rb):
    d = client.get("/dashboard/summary", headers=rb).json()
    assert d["total"] == 14
    assert d["byStatus"]["Pending"] == 5
    assert d["byStatus"]["Under Process"] == 5
    assert d["byStatus"]["Disposed"] == 2
    assert d["overdue"] == 2


def test_cases_filter_and_camelcase(client, rb):
    rows = client.get("/cases", params={"bureau": "PGRC"}, headers=rb).json()
    assert rows and all(r["bureau"] == "PGRC" for r in rows)
    assert "institutionId" in rows[0] and "dueDate" in rows[0]
    od = client.get("/cases", params={"overdue": "true"}, headers=rb).json()
    assert {c["id"] for c in od} == {"CMP-2026-0104", "CMP-2026-0110"}


def test_case_detail_has_timeline(client, rb):
    d = client.get("/cases/CMP-2026-0104", headers=rb).json()
    assert len(d["timeline"]) >= 3 and "OV-002" in d["overlapIds"]


def test_masked_cross_bureau_view(client, regional):
    rows = client.get("/cases", headers=regional).json()
    other = next(r for r in rows if r["bureau"] == "PGRC")
    assert other["officer"] == "Restricted"
    own = next(r for r in rows if r["bureau"] == "Regional Office")
    assert own["officer"] != "Restricted"


def test_overlap_decision_is_audited_and_rbac(client, rb, regional, senior):
    assert client.post("/overlaps/OV-001/decision", json={"verdict": "Confirmed"}, headers=regional).status_code == 403
    r = client.post("/overlaps/OV-001/decision", json={"verdict": "Confirmed", "remarks": "same lecturers"}, headers=rb)
    assert r.status_code == 200 and r.json()["status"] == "Confirmed"
    assert client.post("/overlaps/OV-001/decision", json={"verdict": "Bogus"}, headers=rb).status_code == 422
    log = client.get("/audit", params={"entity": "overlap", "entityId": "OV-001"}, headers=senior).json()
    assert any(e["action"] == "overlap.decision" for e in log)
    assert client.get("/audit", headers=rb).status_code == 403  # audit is for management/admin


def test_create_case_routes_and_suggests_overlap(client, rb):
    body = {"institutionId": "1-2345678902", "category": "Infrastructure", "source": "Parent",
            "description": "Laboratory equipment is missing and the library is below norms."}
    r = client.post("/cases", json=body, headers=rb)
    assert r.status_code == 201, r.text
    out = r.json()
    assert out["case"]["bureau"] == "RB" and out["routing"]["confidence"] == "rule"
    assert out["case"]["id"].startswith("CMP-2026-")


def test_unknown_institution_rejected(client, rb):
    body = {"institutionId": "9-9999999999", "category": "Fee Refund", "description": "A refund was not paid."}
    assert client.post("/cases", json=body, headers=rb).status_code == 422


def test_reports_and_csv(client, rb):
    rows = client.get("/reports/bureau", headers=rb).json()
    assert {r["Bureau"] for r in rows} == {"RB", "PGRC", "Approval Bureau", "Regional Office"}
    csv_text = client.get("/reports/bureau.csv", headers=rb)
    assert csv_text.headers["content-type"].startswith("text/csv") and "Bureau" in csv_text.text
    assert client.get("/reports/nope", headers=rb).status_code == 404


def test_alerts_ack(client, rb):
    alerts = client.get("/alerts", headers=rb).json()
    assert len(alerts) >= 8
    a = client.post(f"/alerts/{alerts[0]['id']}/acknowledge", headers=rb).json()
    assert a["acknowledged"] is True


# ---- pure-logic tests -----------------------------------------------------
def test_routing_rules_and_manual_triage():
    assert recommend("Fee Refund", "refund not paid").recommended_bureau == "PGRC"
    r = recommend("Unknown Thing", "x")
    assert r.recommended_bureau is None and r.confidence == "manual-triage"
    multi = recommend("Fee Refund", "refund not paid and also faculty are unqualified")
    assert multi.confidence == "manual-triage"


def test_text_similarity_semantics():
    close = ov.text_similarity("Laboratories below prescribed norms", "Lab equipment unavailable below norms")
    far = ov.text_similarity("Laboratories below prescribed norms", "Degree certificate not received")
    assert close > far


def test_tiers():
    assert ov.tier_for(91) == "A" and ov.tier_for(65) == "B" and ov.tier_for(30) == "C"
