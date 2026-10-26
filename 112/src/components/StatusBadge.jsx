const map = {
  "Pending": "badge-pending",
  "Under Process": "badge-process",
  "Disposed": "badge-disposed",
  "Transferred": "badge-transferred",
  "Escalated": "badge-escalated",
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${map[status] || ""}`}>{status}</span>;
}