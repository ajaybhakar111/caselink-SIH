import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge.jsx";
import Timeline from "../components/Timeline.jsx";
import OverlapBanner from "../components/OverlapBanner.jsx";
import {
  getCase, getInstitution, overlaps, baseActions,
  isOverdue, daysBetween, TODAY,
} from "../data/mockData";

export default function CaseDetail() {
  const { id } = useParams();
  const [remark, setRemark] = useState("");
  const [added, setAdded] = useState([]);

  const c = getCase(id);

  if (!c) {
    return (
      <div className="card">
        <div className="card-title">Case not found</div>
        <Link to="/cases">← Back to all cases</Link>
      </div>
    );
  }

  const inst = getInstitution(c.institutionId);
  const role = localStorage.getItem("role") || "Official";
  const todayStr = TODAY.toISOString().slice(0, 10);

  const related = overlaps.filter((o) => o.caseIds.includes(c.id));
  const daysLeft = daysBetween(c.dueDate, todayStr);
  const age = daysBetween(todayStr, c.receivedDate);

  const timeline = [...baseActions(c), ...added];

  const movement = [];
  if (c.status === "Transferred") {
    movement.push({
      date: c.lastActionDate,
      title: c.lastAction,
      by: c.officer,
      remarks: `Now with ${c.bureau}.`,
    });
  }
  if (c.status === "Escalated") {
    movement.push({
      date: c.lastActionDate,
      title: c.lastAction,
      by: c.officer,
      remarks: "Awaiting decision from the competent authority.",
    });
  }

  const documents = [
    { name: `Complaint_${c.id}.pdf`, size: "220 KB" },
    { name: "Supporting_evidence.pdf", size: "1.4 MB" },
    ...(c.status !== "Pending"
      ? [{ name: "Institution_reply_request.pdf", size: "96 KB" }]
      : []),
  ];

  const addRemark = () => {
    if (!remark.trim()) return;
    setAdded((a) => [
      ...a,
      { date: todayStr, title: "Remark added", by: role, remarks: remark.trim() },
    ]);
    setRemark("");
  };

  return (
    <>
      <Link to="/cases" className="back-link">← Back to all cases</Link>

      <div className="page-header">
        <div>
          <div className="page-title mono">{c.id}</div>
          <div className="page-sub">{c.category} · received {c.receivedDate}</div>
        </div>
        <div>
          <StatusBadge status={c.status} />
          {isOverdue(c) && <span className="badge badge-overdue">Overdue</span>}
        </div>
      </div>

      {related.length > 0 && (
        <OverlapBanner>
          This case is linked to another complaint for the same institution handled by a
          different Bureau/Cell. <Link to="/overlaps">Review overlap →</Link>
        </OverlapBanner>
      )}

      <div className="grid grid-2-1 mt">
        <div>
          <div className="card">
            <div className="card-title">Case information</div>
            <div className="info-grid">
              <div>
                <div className="info-label">Institution</div>
                <div className="info-value">
                  <Link to={`/institutions/${inst.id}`}>{inst.name}</Link>
                </div>
              </div>
              <div>
                <div className="info-label">AICTE Permanent ID</div>
                <div className="info-value mono">{inst.id}</div>
              </div>
              <div>
                <div className="info-label">Presently assigned Bureau / Cell</div>
                <div className="info-value">{c.bureau}</div>
              </div>
              <div>
                <div className="info-label">Assigned officer</div>
                <div className="info-value">{c.officer}</div>
              </div>
              <div>
                <div className="info-label">Complaint source</div>
                <div className="info-value">{c.source}</div>
              </div>
              <div>
                <div className="info-label">Region</div>
                <div className="info-value">{inst.region}</div>
              </div>
              <div>
                <div className="info-label">Last action</div>
                <div className="info-value">{c.lastAction}</div>
              </div>
              <div>
                <div className="info-label">Date of last action</div>
                <div className="info-value">{c.lastActionDate}</div>
              </div>
              <div>
                <div className="info-label">Next action required</div>
                <div className="info-value">{c.nextAction}</div>
              </div>
              <div>
                <div className="info-label">Expected disposal date</div>
                <div className="info-value">
                  {c.dueDate}
                  {c.status !== "Disposed" && (
                    <span className={daysLeft < 0 ? "muted" : "muted"} style={{ fontWeight: 400 }}>
                      {" "}
                      ({daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="info-label">Complaint description</div>
              <div style={{ marginTop: 4 }}>{c.description}</div>
            </div>
          </div>

          <div className="card mt">
            <div className="card-title">Action history <small>chronological</small></div>
            <Timeline items={timeline} />

            <div style={{ marginTop: 10 }}>
              <label className="label">Add remark</label>
              <input
                className="input"
                placeholder="Write a remark and press Add"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRemark()}
              />
              <div className="btn-row" style={{ marginTop: 10 }}>
                <button className="btn btn-sm" onClick={addRemark}>Add remark</button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-title">Timeline summary</div>
            <div className="info-grid">
              <div>
                <div className="info-label">Case age</div>
                <div className="info-value">{age} days</div>
              </div>
              <div>
                <div className="info-label">Linked cases</div>
                <div className="info-value">{related.length}</div>
              </div>
            </div>
          </div>

          <div className="card mt">
            <div className="card-title">Linked / overlapping cases</div>
            {related.length === 0 && (
              <div className="muted">No related cases detected.</div>
            )}
            {related.map((o) => {
              const otherId = o.caseIds.find((x) => x !== c.id);
              const other = getCase(otherId);
              return (
                <div key={o.id} className="pair-box" style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Link to={`/cases/${other.id}`} className="mono">{other.id}</Link>
                    <span className="score">{o.similarity}%</span>
                  </div>
                  <div className="muted" style={{ marginTop: 6 }}>
                    {other.bureau} · {other.officer}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <StatusBadge status={other.status} />
                    <span className="muted" style={{ marginLeft: 8 }}>{o.status}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card mt">
            <div className="card-title">Transfer / escalation history</div>
            {movement.length ? (
              <Timeline items={movement} />
            ) : (
              <div className="muted">No transfers or escalations recorded.</div>
            )}
          </div>

          <div className="card mt">
            <div className="card-title">Supporting documents</div>
            {documents.map((d) => (
              <div key={d.name} className="doc-item">
                <span>📄 {d.name}</span>
                <span className="muted">{d.size}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}