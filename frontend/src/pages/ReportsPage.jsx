import { useEffect, useState } from 'react';
import { apiJSON } from '../lib/api';
import { useToast } from '../components/Toast';
import { useUser } from '../App';

export default function ReportsPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [annualYear, setAnnualYear] = useState(String(new Date().getFullYear()));
  const [monthly, setMonthly] = useState(null);
  const [annual, setAnnual] = useState(null);
  const { showToast } = useToast();
  const { setLoading } = useUser();

  const load = async () => {
    setLoading(true);
    try {
      const [m, a] = await Promise.all([
        apiJSON(`/api/reports/monthly?month=${month}`),
        apiJSON(`/api/reports/annual?year=${annualYear}`)
      ]);
      setMonthly(m);
      setAnnual(a);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, annualYear]);

  return (
    <div>
      <div className="page-head">
        <h1>Reports</h1>
        <div className="head-actions">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          <input value={annualYear} onChange={(e) => setAnnualYear(e.target.value)} />
          <a className="btn" href={`/api/reports/export?start_date=${month}-01&currency=USD`} target="_blank">Export CSV</a>
        </div>
      </div>
      <div className="reports-grid">
        <div className="card">
          <h3>Monthly Summary</h3>
          <p className="mono">Income: {Number(monthly?.summary?.income || 0).toLocaleString()}</p>
          <p className="mono">Expenses: {Number(monthly?.summary?.expenses || 0).toLocaleString()}</p>
          <p className="mono">Savings: {Number(monthly?.summary?.savings || 0).toLocaleString()}</p>
        </div>
        <div className="card">
          <h3>Annual Totals ({annualYear})</h3>
          <p className="mono">Income: {Number(annual?.totals?.income || 0).toLocaleString()}</p>
          <p className="mono">Expenses: {Number(annual?.totals?.expenses || 0).toLocaleString()}</p>
          <p className="mono">Savings: {Number(annual?.totals?.savings || 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
