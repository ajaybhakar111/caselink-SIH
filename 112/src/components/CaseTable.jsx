import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";
import { getInstitution, isOverdue, hasOverlap } from "../data/mockData";

export default function CaseTable({ rows, showInstitution = true }) {
  const navigate = useNavigate();

  if (!rows.length) {
    return <div className="muted" style={{ padding: 20 }}>No cases match the current filters.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Case ID</th>
            {showInstitution && <th>Institution</th>}
            <th>Category</th>
            <th>Bureau / Cell</th>
            <th>Officer</th>
            <th>Status</th>
            <th>Due date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const inst = getInstitution(c.institutionId);
            return (
              <tr key={c.id} className="row-click" onClick={() => navigate(`/cases/${c.id}`)}>
                <td className="mono">{c.id}</td>
                {showInstitution && <td>{inst?.name}</td>}
                <td>{c.category}</td>
                <td>{c.bureau}</td>
                <td>{c.officer}</td>
                <td>
                  <StatusBadge status={c.status} />
                  {isOverdue(c) && <span className="badge badge-overdue">Overdue</span>}
                  {hasOverlap(c.id) && <span className="badge badge-overlap">Overlap</span>}
                </td>
                <td>{c.dueDate}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}