export default function Timeline({ items }) {
  if (!items.length) {
    return <div className="muted">Nothing recorded yet.</div>;
  }

  return (
    <div className="timeline">
      {items.map((item, i) => (
        <div className="timeline-item" key={i}>
          <div className="timeline-title">{item.title}</div>
          <div className="timeline-meta">
            {item.date} · {item.by}
          </div>
          {item.remarks && <div className="timeline-remarks">{item.remarks}</div>}
        </div>
      ))}
    </div>
  );
}