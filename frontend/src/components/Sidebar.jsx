import { NavLink, useNavigate } from 'react-router-dom';
import { apiFetch, removeToken } from '../lib/api';

const icon = {
  dashboard: '▦',
  tx: '$',
  budgets: '◈',
  reports: '▥'
};

export default function Sidebar({ user, setUser }) {
  const navigate = useNavigate();

  const initials = (user?.name || 'User')
    .split(' ')
    .map((x) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      removeToken();
      setUser(null);
      navigate('/');
    }
  };

  return (
    <aside className="sidebar">
      <div>
        <div className="logo">FinTrack</div>
        <div className="logo-sub">Personal Finance</div>
        <nav className="nav">
          <NavLink to="/dashboard" className="nav-link">{icon.dashboard} Dashboard</NavLink>
          <NavLink to="/transactions" className="nav-link">{icon.tx} Transactions</NavLink>
          <NavLink to="/budgets" className="nav-link">{icon.budgets} Budgets</NavLink>
          <NavLink to="/reports" className="nav-link">{icon.reports} Reports</NavLink>
        </nav>
      </div>
      <div className="sidebar-footer card">
        <div className="avatar">{initials}</div>
        <div>
          <p>{user?.name || 'Loading...'}</p>
          <p className="muted">{user?.email || '-'}</p>
        </div>
        <button className="btn btn-danger" onClick={logout}>Logout</button>
      </div>
    </aside>
  );
}
