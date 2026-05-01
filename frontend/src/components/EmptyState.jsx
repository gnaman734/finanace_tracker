export default function EmptyState({ title, subtitle }) {
  return (
    <div className="card empty-state">
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  );
}
