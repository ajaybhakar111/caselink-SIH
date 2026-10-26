"""Rule-based routing with manual triage fallback.

IMPORTANT: these rules are ILLUSTRATIVE for the prototype. The real allocation of
complaint categories to Bureaus/Cells must be confirmed by AICTE and then edited here
(or moved into a versioned database table). Anything the rules cannot place goes to
manual triage instead of being guessed.
"""
from dataclasses import dataclass

RULES_VERSION = "v1.2-illustrative"

# category -> (bureau, rule id)
CATEGORY_RULES: dict[str, tuple[str, str]] = {
    "Fee Refund": ("PGRC", "R-FEE-01"),
    "Certificate Issue": ("PGRC", "R-CERT-01"),
    "Admission Irregularity": ("PGRC", "R-ADM-01"),
    "Placement Misrepresentation": ("PGRC", "R-PLC-01"),
    "Faculty Qualification": ("RB", "R-FAC-01"),
    "Infrastructure": ("RB", "R-INF-01"),
    "Unapproved Course": ("RB", "R-APR-01"),
    "Approval Delay": ("Approval Bureau", "R-APD-01"),
}

# Words that suggest a field verification is needed -> Regional Office
FIELD_HINTS = ("inspection", "site visit", "physical verification", "on-ground")


@dataclass
class Routing:
    recommended_bureau: str | None
    rule: str
    confidence: str
    note: str


def recommend(category: str, description: str = "") -> Routing:
    text = description.lower()
    hit = CATEGORY_RULES.get(category)
    if hit is None:
        return Routing(None, "none", "manual-triage", "No rule for this category. Send to manual triage.")
    bureau, rule = hit
    # Multi-issue complaints are ambiguous: do not auto-route
    other_categories = [c for c in CATEGORY_RULES if c != category and c.lower().split()[0] in text]
    if other_categories:
        return Routing(
            None, rule, "manual-triage",
            f"Text also mentions {', '.join(other_categories)}. Multi-issue complaint needs manual triage.",
        )
    if any(h in text for h in FIELD_HINTS):
        return Routing("Regional Office", "R-FLD-01", "rule", "Field verification requested in the text.")
    return Routing(bureau, rule, "rule", f"Matched category rule {rule} ({RULES_VERSION}).")
