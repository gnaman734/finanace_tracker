import { useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState';
import ProgressBar from '../components/ProgressBar';
import { useToast } from '../components/Toast';
import { apiJSON } from '../lib/api';
import { useUser } from '../App';

export default function BudgetsPage() {
  const [rows, setRows] = useState([]);
  const { showToast } = useToast();
  const { setLoading } = useUser();

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await apiJSON('/api/budgets/status');
        setRows(data?.data || []);
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [setLoading, showToast]);

  return (
    <div>
      <div className="page-head"><h1>Budgets</h1></div>
      {!rows.length ? <EmptyState title="No budgets" subtitle="Create budgets by category to keep spending under control." /> : (
        <div className="budget-grid">
          {rows.map((b) => (
            <div className="card" key={b.id}>
              <h3>{b.Category?.name || 'Category Budget'}</h3>
              <p className="muted mono">Limit: {Number(b.amount).toLocaleString()} {b.currency}</p>
              <p className="muted mono">Spent: {Number(b.spent).toLocaleString()}</p>
              <ProgressBar label="Usage" value={b.percentage_used} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
