import { NavLink } from "react-router-dom";
import { alerts } from "../data/mockData";

const links = [
  { to: "/", label: "Dashboard", icon: "▦", end: true },
  { to: "/cases", label: "All Cases", icon: "☰" },
  { to: "/overlaps", label: "Overlap Queue", icon: "⚠" },
  { to: "/alerts", label: "Alerts", icon: "🔔", badge: alerts.filter((a) => a.severity === "High").length },
  { to: "/reports", label: "Reports", icon: "📊" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">CL</div>
        <div>
          <div className="brand-name">CASELINK</div>
          <div className="brand-sub">AICTE Case Monitoring</div>
        </div>
      </div>

      <nav className="nav">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? "active" : "")}>
            <span>{l.icon}</span>
            {l.label}
            {l.badge ? <span className="nav-badge">{l.badge}</span> : null}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">Single source of truth for institution complaints</div>
    </aside>
  );
}