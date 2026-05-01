export default function LoadingBar({ loading }) {
  return (
    <div className={`loading-wrap ${loading ? 'active' : ''}`}>
      <div className="loading-bar" />
    </div>
  );
}
