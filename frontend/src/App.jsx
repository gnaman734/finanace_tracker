import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LoadingBar from './components/LoadingBar';
import { ToastProvider } from './components/Toast';
import { apiJSON, getToken, removeToken } from './lib/api';
import BudgetsPage from './pages/BudgetsPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ReportsPage from './pages/ReportsPage';
import TransactionsPage from './pages/TransactionsPage';

const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

function AuthGuard({ children }) {
  const token = getToken();
  const location = useLocation();
  if (!token) return <Navigate to="/" replace state={{ from: location }} />;
  return children;
}

function Shell({ children }) {
  const { user, setUser, loading } = useUser();
  return (
    <div className="app-shell">
      <LoadingBar loading={loading} />
      <Sidebar user={user} setUser={setUser} />
      <main className="content">{children}</main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) return;
    const run = async () => {
      setLoading(true);
      try {
        const data = await apiJSON('/api/auth/me');
        setUser(data?.data || data?.user || data || null);
      } catch {
        removeToken();
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const value = useMemo(() => ({ user, setUser, loading, setLoading }), [user, loading]);

  return (
    <ToastProvider>
      <UserContext.Provider value={value}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <Shell><DashboardPage /></Shell>
              </AuthGuard>
            }
          />
          <Route
            path="/transactions"
            element={
              <AuthGuard>
                <Shell><TransactionsPage /></Shell>
              </AuthGuard>
            }
          />
          <Route
            path="/budgets"
            element={
              <AuthGuard>
                <Shell><BudgetsPage /></Shell>
              </AuthGuard>
            }
          />
          <Route
            path="/reports"
            element={
              <AuthGuard>
                <Shell><ReportsPage /></Shell>
              </AuthGuard>
            }
          />
          <Route path="/auth-callback" element={<LoginPage callbackMode />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </UserContext.Provider>
    </ToastProvider>
  );
}
