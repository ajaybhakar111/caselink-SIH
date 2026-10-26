import { useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge.jsx";
import OverlapBanner from "../components/OverlapBanner.jsx";
import {
  overlaps as initialOverlaps, getCase, getInstitution, TODAY,
} from "../data/mockData";

const TABS = ["All", "Pending Review", "Confirmed", "Rejected", "Further Review"];

function CaseBox({ c }) {
  return (
    <div className="pair-box">
      <Link to={`/cases/${c.id}`} className="mono">{c.id}</Link>
      <div style={{ marginTop: 8 }}>
        <StatusBadge status={c.status} />
      </div>
      <div className="info-label" style={{ marginTop: 10 }}>Bureau / Cell</div>
      <div className="info-value">{c.bureau}</div>
      <div className="info-label" style={{ marginTop: 8 }}>Officer</div>
      <div className="info-value">{c.officer}</div>
      <div className="info-label" style={{ marginTop: 8 }}>Last action</div>
      <div>{c.lastAction}</div>
      <div className="info-label" style={{ marginTop: 8 }}>Complaint</div>
      <div className="muted">{c.description}</div>
    </div>
  );
}

export default function OverlapQueue() {
  const [items, setItems] = useState(initialOverlaps);
  const [tab, setTab] = useState("All");

  const role = localStorage.getItem("role") || "Official";
  const todayStr = TODAY.toISOString().slice(0, 10);

  const decide = (id, status) => {
    setItems((list) =>
      list.map((o) =>
        o.id === id
          ? { ...o, status, reviewedBy: role, reviewedOn: todayStr }
          : o
      )
    );
  };

  const reopen = (id) => {
    setItems((list) =>
      list.map((o) =>
        o.id === id
          ? { ...o, status: "Pending Review", reviewedBy: undefined, reviewedOn: undefined }
          : o
      )
    );
  };

  const pendingCount = items.filter((o) => o.status === "Pending Review").length;
  const visible = tab === "All" ? items : items.filter((o) => o.status === tab);

  const statusClass = (s) =>
    s === "Confirmed"
      ? "badge-disposed"
      : s === "Rejected"
      ? "badge-escalated"
      : s === "Further Review"
      ? "badge-transferred"
      : "badge-pending";

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Overlap Review Queue</div>
          <div className="page-sub">
            Suggested relationships between cases. Officials make the final decision.
          </div>
        </div>
        <div className="muted">{pendingCount} awaiting review</div>
      </div>

      {pendingCount > 0 && (
        <OverlapBanner>
          {pendingCount} potential overlaps need coordination between Bureaus/Cells.
          A similarity score is a suggestion, not proof of duplication.
        </OverlapBanner>
      )}

      <div className="tabs mt">
        {TABS.map((t) => (
          <button
            key={t}
            className={`tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
            {t !== "All" && ` (${items.filter((o) => o.status === t).length})`}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="card muted">No overlaps in this view.</div>
      )}

      {visible.map((o) => {
        const inst = getInstitution(o.institutionId);
        const [a, b] = o.caseIds.map(getCase);

        return (
          <div className="card overlap-card" key={o.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span className="mono muted">{o.id}</span>
                <div className="card-title" style={{ marginBottom: 0, marginTop: 4 }}>
                  <Link to={`/institutions/${inst.id}`}>{inst.name}</Link>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className="score">{o.similarity}% match</span>
                <div style={{ marginTop: 8 }}>
                  <span className={`badge ${statusClass(o.status)}`}>{o.status}</span>
                </div>
              </div>
            </div>

            <div className="overlap-pair">
              <CaseBox c={a} />
              <div className="pair-vs">⇄</div>
              <CaseBox c={b} />
            </div>

            <div className="grid grid-2">
              <div>
                <div className="info-label">Why the system suggests a link</div>
                <ul className="reason-list">
                  {o.reasons.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </div>
              <div>
                <div className="info-label">Differences to consider</div>
                <ul className="reason-list diff-list">
                  {o.differences.map((d) => <li key={d}>{d}</li>)}
                </ul>
              </div>
            </div>

            <div className="review-bar">
              {o.status === "Pending Review" ? (
                <div className="btn-row">
                  <button className="btn btn-green btn-sm" onClick={() => decide(o.id, "Confirmed")}>
                    Confirm related
                  </button>
                  <button className="btn btn-red btn-sm" onClick={() => decide(o.id, "Rejected")}>
                    Reject suggestion
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => decide(o.id, "Further Review")}>
                    Request further review
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="muted">
                    {o.reviewedBy
                      ? `Marked "${o.status}" by ${o.reviewedBy} on ${o.reviewedOn}. Recorded in audit history.`
                      : `Marked "${o.status}". Recorded in audit history.`}
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={() => reopen(o.id)}>
                    Reopen
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}