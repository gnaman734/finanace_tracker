export default function StatCard({ label, value, tone = 'blue' }) {
  return (
    <div className={`card stat-card stat-${tone}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value mono">{value}</p>
    </div>
  );
}
