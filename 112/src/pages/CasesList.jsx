import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import CaseTable from "../components/CaseTable.jsx";
import {
  cases, getInstitution,
  BUREAUS, STATUSES, REGIONS, CATEGORIES,
} from "../data/mockData";

const emptyFilters = {
  bureau: "",
  region: "",
  category: "",
  status: "",
  from: "",
  to: "",
};

export default function CasesList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(emptyFilters);

  // The search text lives in the URL so the top bar search and this page stay in sync
  const q = searchParams.get("q") || "";

  const setQuery = (value) => {
    if (value) setSearchParams({ q: value }, { replace: true });
    else setSearchParams({}, { replace: true });
  };

  const update = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const reset = () => {
    setFilters(emptyFilters);
    setSearchParams({}, { replace: true });
  };

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();

    return cases
      .filter((c) => {
        const inst = getInstitution(c.institutionId);

        if (term) {
          const haystack = `${c.id} ${inst?.name} ${inst?.id}`.toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        if (filters.bureau && c.bureau !== filters.bureau) return false;
        if (filters.region && inst?.region !== filters.region) return false;
        if (filters.category && c.category !== filters.category) return false;
        if (filters.status && c.status !== filters.status) return false;
        if (filters.from && c.receivedDate < filters.from) return false;
        if (filters.to && c.receivedDate > filters.to) return false;
        return true;
      })
      .sort((a, b) => new Date(b.receivedDate) - new Date(a.receivedDate));
  }, [q, filters]);

  const activeCount =
    Object.values(filters).filter(Boolean).length + (q ? 1 : 0);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">All Cases</div>
          <div className="page-sub">
            Search and filter institution complaints across all Bureaus/Cells
          </div>
        </div>
        <div className="muted">
          Showing {rows.length} of {cases.length} cases
        </div>
      </div>

      <div className="card">
        <div className="form-group">
          <label className="label">
            Search by institution name, AICTE Permanent ID or Case ID
          </label>
          <input
            className="input"
            placeholder="e.g. Venkateswara, 1-2345678901, CMP-2026-0102"
            value={q}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="filters">
          <div>
            <label className="label">Bureau / Cell</label>
            <select
              className="select"
              value={filters.bureau}
              onChange={(e) => update("bureau", e.target.value)}
            >
              <option value="">All</option>
              {BUREAUS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Region</label>
            <select
              className="select"
              value={filters.region}
              onChange={(e) => update("region", e.target.value)}
            >
              <option value="">All</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Complaint category</label>
            <select
              className="select"
              value={filters.category}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="">All</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="select"
              value={filters.status}
              onChange={(e) => update("status", e.target.value)}
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Received from</label>
            <input
              className="input"
              type="date"
              value={filters.from}
              onChange={(e) => update("from", e.target.value)}
            />
          </div>

          <div>
            <label className="label">Received to</label>
            <input
              className="input"
              type="date"
              value={filters.to}
              onChange={(e) => update("to", e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="btn btn-ghost" onClick={reset} style={{ width: "100%" }}>
              Reset{activeCount ? ` (${activeCount})` : ""}
            </button>
          </div>
        </div>
      </div>

      <div className="card mt">
        <CaseTable rows={rows} />
      </div>
    </>
  );
}