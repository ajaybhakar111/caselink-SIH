export default function OverlapBanner({ children }) {
  return (
    <div className="overlap-banner">
      <div className="overlap-icon">⚠</div>
      <div>
        <div className="overlap-title">Potential Overlapping Cases – Coordination Required</div>
        <div className="overlap-text">{children}</div>
      </div>
    </div>
  );
}