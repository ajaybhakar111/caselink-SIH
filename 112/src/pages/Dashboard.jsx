import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line,
} from "recharts";
import StatCard from "../components/StatCard.jsx";
import CaseTable from "../components/CaseTable.jsx";
import OverlapBanner from "../components/OverlapBanner.jsx";
import {
  cases, institutions, overlaps, monthlyTrend,
  BUREAUS, STATUSES, isOverdue,
} from "../data/mockData";

const STATUS_COLORS = {
  "Pending": "#f5b942",
  "Under Process": "#4da3ff",
  "Disposed": "#2ecc8f",
  "Transferred": "#a78bfa",
  "Escalated": "#ff5d6c",
};

const tooltipStyle = {
  contentStyle: {
    background: "#0b1a33",
    border: "1px solid #1b3560",
    borderRadius: 8,
    color: "#e6edf9",
  },
  labelStyle: { color: "#8ea3c7" },
};

export default function Dashboard() {
  const count = (s) => cases.filter((c) => c.status === s).length;
  const overdue = cases.filter(isOverdue).length;
  const pendingOverlaps = overlaps.filter((o) => o.status === "Pending Review");

  const bureauData = BUREAUS.map((b) => ({
    bureau: b,
    Open: cases.filter((c) => c.bureau === b && c.status !== "Disposed").length,
    Disposed: cases.filter((c) => c.bureau === b && c.status === "Disposed").length,
  }));

  const statusData = STATUSES.map((s) => ({ name: s, value: count(s) })).filter((d) => d.value > 0);

  const institutionData = institutions
    .map((i) => ({
      ...i,
      total: cases.filter((c) => c.institutionId === i.id).length,
      open: cases.filter((c) => c.institutionId === i.id && c.status !== "Disposed").length,
    }))
    .sort((a, b) => b.open - a.open)
    .slice(0, 5);
  const maxOpen = Math.max(...institutionData.map((i) => i.open), 1);

  const recent = [...cases]
    .sort((a, b) => new Date(b.lastActionDate) - new Date(a.lastActionDate))
    .slice(0, 6);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Integrated Dashboard</div>
          <div className="page-sub">Real-time view of institution complaints across all Bureaus/Cells</div>
        </div>
        <div className="muted">As of 23 Oct 2026</div>
      </div>

      {pendingOverlaps.length > 0 && (
        <OverlapBanner>
          {pendingOverlaps.length} institutions have cases being handled by more than one Bureau/Cell.{" "}
          <Link to="/overlaps">Review overlaps →</Link>
        </OverlapBanner>
      )}

      <div className="grid grid-6 mt">
        <StatCard label="Total Cases" value={cases.length} hint="All Bureaus/Cells" />
        <StatCard label="Pending" value={count("Pending")} hint="Awaiting action" color="stat-amber" />
        <StatCard label="Under Process" value={count("Under Process")} hint="Active handling" />
        <StatCard label="Disposed" value={count("Disposed")} hint="Closed cases" color="stat-green" />
        <StatCard label="Transferred" value={count("Transferred")} hint="Moved between units" color="stat-purple" />
        <StatCard label="Beyond Timeline" value={overdue} hint="Past due date" color="stat-red" />
      </div>

      <div className="grid grid-2-1 mt">
        <div className="card">
          <div className="card-title">Bureau / Cell-wise workload</div>
          <div className="chart-box">
            <ResponsiveContainer>
              <BarChart data={bureauData}>
                <CartesianGrid stroke="#1b3560" strokeDasharray="3 3" />
                <XAxis dataKey="bureau" stroke="#8ea3c7" />
                <YAxis stroke="#8ea3c7" allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Legend />
                <Bar dataKey="Open" stackId="a" fill="#4da3ff" />
                <Bar dataKey="Disposed" stackId="a" fill="#2ecc8f" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Status distribution</div>
          <div className="chart-box">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {statusData.map((d) => (
                    <Cell key={d.name} fill={STATUS_COLORS[d.name]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-2 mt">
        <div className="card">
          <div className="card-title">Monthly trend <small>received vs disposed</small></div>
          <div className="chart-box">
            <ResponsiveContainer>
              <LineChart data={monthlyTrend}>
                <CartesianGrid stroke="#1b3560" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#8ea3c7" />
                <YAxis stroke="#8ea3c7" />
                <Tooltip {...tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="received" stroke="#f5b942" strokeWidth={2} />
                <Line type="monotone" dataKey="disposed" stroke="#2ecc8f" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Institution-wise open cases <small>top 5</small></div>
          {institutionData.map((i) => (
            <div key={i.id} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Link to={`/institutions/${i.id}`}>{i.name}</Link>
                <span className="muted">{i.open} open / {i.total} total</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(i.open / maxOpen) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt">
        <div className="card-title">
          Recent activity <small>latest actions across Bureaus</small>
        </div>
        <CaseTable rows={recent} />
      </div>
    </>
  );
}