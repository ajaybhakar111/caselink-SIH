"""Explainable overlap detection.

Pipeline (kept deliberately simple and dependency-free for the prototype):
  1. GATE      same institution, different Bureau/Cell, both cases still open.
  2. SCORE     weighted blend of category match, TF-IDF cosine similarity of the
               complaint text, shared keywords and time proximity.
  3. TIER      A (coordinate) / B (manual review) / C (same institution, info only).
  4. EXPLAIN   human-readable reasons and differences for the officer.

The score is a SUGGESTION. Nothing is merged automatically: an authorised officer
records the verdict (Confirmed / Rejected / Further Review).

Production upgrade path: replace `text_similarity` with cosine similarity of multilingual
sentence embeddings (e.g. SBERT/LaBSE) stored in PostgreSQL + pgvector. The rest of the
pipeline stays the same.
"""
import math
import re
from collections import Counter
from datetime import date

from ..config import settings
from ..models import Case

STOPWORDS = set(
    "a an the and or of to in on for is are was were be been by with that this these those it its as at from "
    "has have had not no but they their them students student faculty institution institutions says say "
    "alleges allege reports report complaint complain complains member several".split()
)

# Weights sum to 1.0
W_CATEGORY, W_TEXT, W_KEYWORDS, W_TIME = 0.35, 0.35, 0.20, 0.10


def tokenize(text: str) -> list[str]:
    return [t for t in re.findall(r"[a-z]{3,}", text.lower()) if t not in STOPWORDS]


def _tfidf(docs: list[list[str]]) -> list[dict[str, float]]:
    n = len(docs)
    df = Counter(t for d in docs for t in set(d))
    out = []
    for d in docs:
        tf = Counter(d)
        out.append({t: (c / max(len(d), 1)) * (math.log((1 + n) / (1 + df[t])) + 1) for t, c in tf.items()})
    return out


def _cosine(a: dict[str, float], b: dict[str, float]) -> float:
    dot = sum(v * b.get(k, 0.0) for k, v in a.items())
    na = math.sqrt(sum(v * v for v in a.values()))
    nb = math.sqrt(sum(v * v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0


def text_similarity(a: str, b: str) -> float:
    ta, tb = tokenize(a), tokenize(b)
    va, vb = _tfidf([ta, tb])
    return _cosine(va, vb)


def passes_gate(a: Case, b: Case) -> bool:
    return (
        a.institution_id == b.institution_id
        and a.bureau != b.bureau
        and a.status != "Disposed"
        and b.status != "Disposed"
    )


def tier_for(score: int) -> str:
    if score >= settings.tier_a_threshold:
        return "A"
    if score >= settings.tier_b_threshold:
        return "B"
    return "C"


def score_pair(a: Case, b: Case) -> dict:
    """Return score (0-100), tier, reasons and differences for two cases."""
    reasons: list[str] = ["Same institution ID"]
    differences: list[str] = []

    same_cat = a.category == b.category
    cat = 1.0 if same_cat else 0.0
    if same_cat:
        reasons.append(f"Same category: {a.category}")
    else:
        differences.append(f"Categories differ ({a.category} vs {b.category})")

    txt = text_similarity(a.description, b.description)
    ka, kb = set(tokenize(a.description)), set(tokenize(b.description))
    shared = sorted(ka & kb)
    jac = len(shared) / len(ka | kb) if (ka | kb) else 0.0
    if shared:
        reasons.append("Overlapping keywords: " + ", ".join(shared[:5]))

    da, db_ = date.fromisoformat(a.received_date), date.fromisoformat(b.received_date)
    gap = abs((da - db_).days)
    time_score = max(0.0, 1.0 - gap / 90.0)
    if gap <= 30:
        reasons.append(f"Received within {gap} days of each other")

    reasons.append(f"Different Bureaus: {a.bureau} and {b.bureau}")

    if a.source != b.source:
        differences.append(f"Complainant types differ ({a.source} vs {b.source})")
    for c in (a, b):
        if c.status in ("Escalated", "Under Process"):
            differences.append(f"Case {c.id[-4:]} is already {c.status.lower()} at {c.bureau}")

    raw = W_CATEGORY * cat + W_TEXT * txt + W_KEYWORDS * min(1.0, jac * 3) + W_TIME * time_score
    score = int(round(raw * 100))
    return {"score": score, "tier": tier_for(score), "reasons": reasons, "differences": differences}


def find_overlaps_for(case: Case, others: list[Case]) -> list[tuple[Case, dict]]:
    """Candidates for one case against a list of cases (used when a new complaint arrives)."""
    results = []
    for o in others:
        if o.id != case.id and passes_gate(case, o):
            r = score_pair(case, o)
            if r["tier"] in ("A", "B"):
                results.append((o, r))
    return sorted(results, key=lambda t: -t[1]["score"])
