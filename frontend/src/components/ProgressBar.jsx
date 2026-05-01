export default function ProgressBar({ value, label }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const tone = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'success';
  return (
    <div className="progress-group">
      <div className="progress-meta">
        <span>{label}</span>
        <span className="mono">{pct.toFixed(1)}%</span>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
