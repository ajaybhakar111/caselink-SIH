import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  ResponsiveContainer, LineChart, Line,
} from "recharts";
import StatCard from "../components/StatCard.jsx";
import {
  cases, institutions, overlaps, monthlyTrend,
  BUREAUS, REGIONS, getInstitution, isOverdue, daysBetween, TODAY,
} from "../data/mockData";

const TABS = ["Bureau-wise", "Region-wise", "Institution-wise", "Ageing", "Overlaps", "Performance"];

const tooltipStyle = {
  contentStyle: {
    background: "#0b1a33",
    border: "1px solid #1b3560",
    borderRadius: 8,
    color: "#e6edf9",
  },
  labelStyle: { color: "#8ea3c7" },
};

const rate = (disposed, total) => (total ? Math.round((disposed / total) * 100) : 0);

function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SummaryTable({ columns, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key}>{r[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Reports() {
  const [tab, setTab] = useState("Bureau-wise");

  const todayStr = TODAY.toISOString().slice(0, 10);
  const total = cases.length;
  const disposed = cases.filter((c) => c.status === "Disposed").length;
  const overdue = cases.filter(isOverdue).length;
  const open = cases.filter((c) => c.status !== "Disposed");
  const avgAge = open.length
    ? Math.round(open.reduce((s, c) => s + daysBetween(todayStr, c.receivedDate), 0) / open.length)
    : 0;

  // Bureau-wise
  const bureauRows = BUREAUS.map((b) => {
    const list = cases.filter((c) => c.bureau === b);
    const d = list.filter((c) => c.status === "Disposed").length;
    return {
      Bureau: b,
      Total: list.length,
      Pending: list.filter((c) => c.status === "Pending").length,
      "Under Process": list.filter((c) => c.status === "Under Process").length,
      Disposed: d,
      Transferred: list.filter((c) => c.status === "Transferred").length,
      Escalated: list.filter((c) => c.status === "Escalated").length,
      Overdue: list.filter(isOverdue).length,
      "Disposal rate": `${rate(d, list.length)}%`,
    };
  });

  // Region-wise
  const regionRows = REGIONS.map((r) => {
    const list = cases.filter((c) => getInstitution(c.institutionId)?.region === r);
    const d = list.filter((c) => c.status === "Disposed").length;
    return {
      Region: r,
      Total: list.length,
      Open: list.length - d,
      Disposed: d,
      Overdue: list.filter(isOverdue).length,
      "Disposal rate": `${rate(d, list.length)}%`,
    };
  });

  // Institution-wise
  const institutionRows = institutions.map((i) => {
    const list = cases.filter((c) => c.institutionId === i.id);
    const d = list.filter((c) => c.status === "Disposed").length;
    return {
      Institution: i.name,
      "AICTE ID": i.id,
      Region: i.region,
      Total: list.length,
      Open: list.length - d,
      Disposed: d,
      "Bureaus involved": [...new Set(list.map((c) => c.bureau))].join(", "),
    };
  });

  // Ageing of open cases
  const buckets = [
    { label: "0 - 30 days", min: 0, max: 30 },
    { label: "31 - 60 days", min: 31, max: 60 },
    { label: "61 - 90 days", min: 61, max: 90 },
    { label: "90+ days", min: 91, max: Infinity },
  ];
  const ageingData = buckets.map((b) => ({
    bucket: b.label,
    Cases: open.filter((c) => {
      const age = daysBetween(todayStr, c.receivedDate);
      return age >= b.min && age <= b.max;
    }).length,
  }));
  const ageingRows = open
    .map((c) => ({
      "Case ID": c.id,
      Institution: getInstitution(c.institutionId)?.name,
      Bureau: c.bureau,
      Status: c.status,
      "Age (days)": daysBetween(todayStr, c.receivedDate),
      "Due date": c.dueDate,
    }))
    .sort((a, b) => b["Age (days)"] - a["Age (days)"]);

  // Overlap report
  const overlapRows = overlaps.map((o) => {
    const [a, b] = o.caseIds.map((id) => cases.find((c) => c.id === id));
    return {
      "Overlap ID": o.id,
      Institution: getInstitution(o.institutionId)?.name,
      "Case A": `${a.id} (${a.bureau})`,
      "Case B": `${b.id} (${b.bureau})`,
      Similarity: `${o.similarity}%`,
      "Detected on": o.detectedOn,
      "Review status": o.status,
    };
  });

  // Performance
  const performanceRows = monthlyTrend.map((m) => ({
    Month: m.month,
    Received: m.received,
    Disposed: m.disposed,
    "Disposal rate": `${rate(m.disposed, m.received)}%`,
  }));

  const keysOf = (rows) => Object.keys(rows[0]).map((k) => ({ key: k, label: k }));

  const exportMap = {
    "Bureau-wise": ["bureau-wise-report.csv", bureauRows],
    "Region-wise": ["region-wise-report.csv", regionRows],
    "Institution-wise": ["institution-wise-report.csv", institutionRows],
    Ageing: ["pending-ageing-report.csv", ageingRows],
    Overlaps: ["overlap-report.csv", overlapRows],
    Performance: ["monthly-performance-report.csv", performanceRows],
  };

  const [file, data] = exportMap[tab];

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Reports &amp; Analytics</div>
          <div className="page-sub">
            Bureau, region, institution, ageing, overlap and performance reports
          </div>
        </div>
        <button className="btn btn-sm" onClick={() => downloadCsv(file, data)}>
          ⬇ Download CSV
        </button>
      </div>

      <div className="grid grid-4">
        <StatCard label="Disposal Rate" value={`${rate(disposed, total)}%`} hint={`${disposed} of ${total} cases`} color="stat-green" />
        <StatCard label="Open Cases" value={open.length} hint="Not yet disposed" color="stat-amber" />
        <StatCard label="Avg. Age of Open Cases" value={`${avgAge} d`} hint="Since date of receipt" />
        <StatCard label="Beyond Timeline" value={overdue} hint="Past due date" color="stat-red" />
      </div>

      <div className="tabs mt-lg">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Bureau-wise" && (
        <>
          <div className="card">
            <div className="card-title">Cases by Bureau / Cell</div>
            <div className="chart-box">
              <ResponsiveContainer>
                <BarChart data={bureauRows}>
                  <CartesianGrid stroke="#1b3560" strokeDasharray="3 3" />
                  <XAxis dataKey="Bureau" stroke="#8ea3c7" />
                  <YAxis stroke="#8ea3c7" allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend />
                  <Bar dataKey="Pending" stackId="a" fill="#f5b942" />
                  <Bar dataKey="Under Process" stackId="a" fill="#4da3ff" />
                  <Bar dataKey="Disposed" stackId="a" fill="#2ecc8f" />
                  <Bar dataKey="Transferred" stackId="a" fill="#a78bfa" />
                  <Bar dataKey="Escalated" stackId="a" fill="#ff5d6c" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card mt">
            <SummaryTable columns={keysOf(bureauRows)} rows={bureauRows} />
          </div>
        </>
      )}

      {tab === "Region-wise" && (
        <>
          <div className="card">
            <div className="card-title">Cases by region</div>
            <div className="chart-box">
              <ResponsiveContainer>
                <BarChart data={regionRows}>
                  <CartesianGrid stroke="#1b3560" strokeDasharray="3 3" />
                  <XAxis dataKey="Region" stroke="#8ea3c7" />
                  <YAxis stroke="#8ea3c7" allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend />
                  <Bar dataKey="Open" fill="#4da3ff" />
                  <Bar dataKey="Disposed" fill="#2ecc8f" />
                  <Bar dataKey="Overdue" fill="#ff5d6c" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card mt">
            <SummaryTable columns={keysOf(regionRows)} rows={regionRows} />
          </div>
        </>
      )}

      {tab === "Institution-wise" && (
        <div className="card">
          <div className="card-title">Institution-wise complaint history</div>
          <SummaryTable columns={keysOf(institutionRows)} rows={institutionRows} />
        </div>
      )}

      {tab === "Ageing" && (
        <>
          <div className="card">
            <div className="card-title">Pending case ageing <small>open cases by days since receipt</small></div>
            <div className="chart-box">
              <ResponsiveContainer>
                <BarChart data={ageingData}>
                  <CartesianGrid stroke="#1b3560" strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" stroke="#8ea3c7" />
                  <YAxis stroke="#8ea3c7" allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="Cases" fill="#f5b942" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card mt">
            <SummaryTable columns={keysOf(ageingRows)} rows={ageingRows} />
          </div>
        </>
      )}

      {tab === "Overlaps" && (
        <div className="card">
          <div className="card-title">Overlapping / duplicate case report</div>
          <SummaryTable columns={keysOf(overlapRows)} rows={overlapRows} />
        </div>
      )}

      {tab === "Performance" && (
        <>
          <div className="card">
            <div className="card-title">Monthly performance <small>received vs disposed</small></div>
            <div className="chart-box">
              <ResponsiveContainer>
                <LineChart data={performanceRows}>
                  <CartesianGrid stroke="#1b3560" strokeDasharray="3 3" />
                  <XAxis dataKey="Month" stroke="#8ea3c7" />
                  <YAxis stroke="#8ea3c7" />
                  <Tooltip {...tooltipStyle} />
                  <Legend />
                  <Line type="monotone" dataKey="Received" stroke="#f5b942" strokeWidth={2} />
                  <Line type="monotone" dataKey="Disposed" stroke="#2ecc8f" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card mt">
            <SummaryTable columns={keysOf(performanceRows)} rows={performanceRows} />
          </div>
        </>
      )}
    </>
  );
}