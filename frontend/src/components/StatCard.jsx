export default function StatCard({ label, value, hint, color = "" }) {
  return (
    <div className={`card stat-card ${color}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}