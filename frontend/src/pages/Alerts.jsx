import { useState } from "react";
import { Link } from "react-router-dom";
import { alerts as initialAlerts, getCase, getInstitution } from "../data/mockData";

const TABS = ["All", "Overdue", "Overlap", "SLA", "Escalation", "Reminder"];

const ICONS = {
  Overdue: "⏰",
  Overlap: "⚠",
  SLA: "⌛",
  Escalation: "⬆",
  Reminder: "🔔",
};

const severityBadge = (s) =>
  s === "High" ? "badge-escalated" : s === "Medium" ? "badge-pending" : "badge-process";

export default function Alerts() {
  const [items, setItems] = useState(
    initialAlerts.map((a) => ({ ...a, acknowledged: false }))
  );
  const [tab, setTab] = useState("All");
  const [showAcked, setShowAcked] = useState(false);

  const acknowledge = (id) =>
    setItems((list) => list.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));

  const acknowledgeAll = () =>
    setItems((list) => list.map((a) => ({ ...a, acknowledged: true })));

  const active = items.filter((a) => !a.acknowledged);
  const high = active.filter((a) => a.severity === "High").length;

  const visible = items
    .filter((a) => (tab === "All" ? true : a.type === tab))
    .filter((a) => (showAcked ? true : !a.acknowledged));

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Alerts &amp; Notifications</div>
          <div className="page-sub">
            Overdue cases, timeline warnings, escalations and overlap alerts
          </div>
        </div>
        <div className="btn-row">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowAcked((v) => !v)}>
            {showAcked ? "Hide acknowledged" : "Show acknowledged"}
          </button>
          <button className="btn btn-sm" onClick={acknowledgeAll} disabled={!active.length}>
            Acknowledge all
          </button>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="card stat-card stat-red">
          <div className="stat-label">High severity</div>
          <div className="stat-value">{high}</div>
        </div>
        <div className="card stat-card stat-amber">
          <div className="stat-label">Active alerts</div>
          <div className="stat-value">{active.length}</div>
        </div>
        <div className="card stat-card stat-purple">
          <div className="stat-label">Overlap alerts</div>
          <div className="stat-value">{active.filter((a) => a.type === "Overlap").length}</div>
        </div>
        <div className="card stat-card stat-green">
          <div className="stat-label">Acknowledged</div>
          <div className="stat-value">{items.length - active.length}</div>
        </div>
      </div>

      <div className="tabs mt-lg">
        {TABS.map((t) => (
          <button
            key={t}
            className={`tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
            {t !== "All" && ` (${active.filter((a) => a.type === t).length})`}
          </button>
        ))}
      </div>

      {visible.length === 0 && <div className="card muted">No alerts in this view.</div>}

      {visible.map((a) => {
        const c = getCase(a.caseId);
        const inst = c && getInstitution(c.institutionId);
        return (
          <div
            key={a.id}
            className={`alert-item alert-${a.severity.toLowerCase()}`}
            style={{ opacity: a.acknowledged ? 0.5 : 1 }}
          >
            <div style={{ fontSize: 22 }}>{ICONS[a.type]}</div>
            <div className="alert-body">
              <div className="alert-type">
                {a.type} · {a.date}
              </div>
              <div style={{ margin: "3px 0" }}>{a.message}</div>
              <div className="muted">
                <Link to={`/cases/${a.caseId}`} className="mono">{a.caseId}</Link>
                {inst && <> · {inst.name}</>}
              </div>
            </div>
            <span className={`badge ${severityBadge(a.severity)}`}>{a.severity}</span>
            <div className="btn-row">
              <Link to={a.type === "Overlap" ? "/overlaps" : `/cases/${a.caseId}`}>
                <button className="btn btn-ghost btn-sm">
                  {a.type === "Overlap" ? "Review" : "Open case"}
                </button>
              </Link>
              {!a.acknowledged && (
                <button className="btn btn-sm" onClick={() => acknowledge(a.id)}>
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}