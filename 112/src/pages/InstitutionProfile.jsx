import { useParams, Link } from "react-router-dom";
import StatCard from "../components/StatCard.jsx";
import CaseTable from "../components/CaseTable.jsx";
import OverlapBanner from "../components/OverlapBanner.jsx";
import {
  cases, overlaps, getInstitution, BUREAUS, isOverdue,
} from "../data/mockData";

export default function InstitutionProfile() {
  const { id } = useParams();
  const inst = getInstitution(id);

  if (!inst) {
    return (
      <div className="card">
        <div className="card-title">Institution not found</div>
        <Link to="/cases">← Back to all cases</Link>
      </div>
    );
  }

  const instCases = cases
    .filter((c) => c.institutionId === inst.id)
    .sort((a, b) => new Date(b.receivedDate) - new Date(a.receivedDate));

  const count = (s) => instCases.filter((c) => c.status === s).length;
  const open = instCases.filter((c) => c.status !== "Disposed");
  const overdue = instCases.filter(isOverdue).length;

  const activeBureaus = [...new Set(open.map((c) => c.bureau))];
  const instOverlaps = overlaps.filter((o) => o.institutionId === inst.id);

  const bureauMix = BUREAUS.map((b) => ({
    bureau: b,
    total: instCases.filter((c) => c.bureau === b).length,
    open: open.filter((c) => c.bureau === b).length,
  })).filter((b) => b.total > 0);

  const maxTotal = Math.max(...bureauMix.map((b) => b.total), 1);

  return (
    <>
      <Link to="/cases" className="back-link">← Back to all cases</Link>

      <div className="page-header">
        <div>
          <div className="page-title">{inst.name}</div>
          <div className="page-sub">
            AICTE Permanent ID: <span className="mono">{inst.id}</span>
          </div>
        </div>
        <div>
          <span className="badge badge-process">{inst.type}</span>
        </div>
      </div>

      {activeBureaus.length > 1 && (
        <OverlapBanner>
          {activeBureaus.length} Bureaus/Cells ({activeBureaus.join(", ")}) are currently
          handling cases for this institution.{" "}
          {instOverlaps.length > 0 && <Link to="/overlaps">Review overlaps →</Link>}
        </OverlapBanner>
      )}

      <div className="grid grid-2-1 mt">
        <div className="card">
          <div className="card-title">Institution details</div>
          <div className="info-grid">
            <div>
              <div className="info-label">Institution name</div>
              <div className="info-value">{inst.name}</div>
            </div>
            <div>
              <div className="info-label">AICTE Permanent ID</div>
              <div className="info-value mono">{inst.id}</div>
            </div>
            <div>
              <div className="info-label">Address</div>
              <div className="info-value">{inst.address}</div>
            </div>
            <div>
              <div className="info-label">City / State</div>
              <div className="info-value">{inst.city}, {inst.state}</div>
            </div>
            <div>
              <div className="info-label">Region</div>
              <div className="info-value">{inst.region}</div>
            </div>
            <div>
              <div className="info-label">Institution type</div>
              <div className="info-value">{inst.type}</div>
            </div>
            <div>
              <div className="info-label">Approved intake</div>
              <div className="info-value">{inst.intake}</div>
            </div>
            <div>
              <div className="info-label">Established</div>
              <div className="info-value">{inst.established}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Bureaus involved</div>
          {bureauMix.map((b) => (
            <div key={b.bureau} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span>{b.bureau}</span>
                <span className="muted">{b.open} open / {b.total} total</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(b.total / maxTotal) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-4 mt">
        <StatCard label="Total Cases" value={instCases.length} hint="All time" />
        <StatCard label="Open Cases" value={open.length} hint="Not yet disposed" color="stat-amber" />
        <StatCard label="Disposed" value={count("Disposed")} hint="Closed cases" color="stat-green" />
        <StatCard label="Beyond Timeline" value={overdue} hint="Past due date" color="stat-red" />
      </div>

      <div className="card mt">
        <div className="card-title">
          Consolidated complaint history <small>across all Bureaus/Cells</small>
        </div>
        <CaseTable rows={instCases} showInstitution={false} />
      </div>
    </>
  );
}