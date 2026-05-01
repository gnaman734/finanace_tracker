import { useEffect, useMemo, useRef, useState } from 'react';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import { apiJSON } from '../lib/api';
import { useToast } from '../components/Toast';
import { useUser } from '../App';

const monthNow = () => new Date().toISOString().slice(0, 7);
const money = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function DashboardPage() {
  const [month, setMonth] = useState(monthNow());
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [categories, setCategories] = useState([]);
  const barRef = useRef(null);
  const doughnutRef = useRef(null);
  const barChart = useRef(null);
  const doughnutChart = useRef(null);
  const { showToast } = useToast();
  const { user, setLoading } = useUser();

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [s, m, c] = await Promise.all([
          apiJSON(`/api/dashboard/summary?month=${month}`),
          apiJSON('/api/dashboard/chart/monthly'),
          apiJSON(`/api/dashboard/chart/category-breakdown?month=${month}`)
        ]);
        setSummary(s?.data || s || null);
        setMonthly(m?.data || m || []);
        setCategories(c?.data || c || []);
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [month, setLoading, showToast]);

  useEffect(() => {
    if (!window.Chart || !barRef.current) return;
    if (barChart.current) barChart.current.destroy();
    barChart.current = new window.Chart(barRef.current, {
      type: 'bar',
      data: {
        labels: monthly.map((x) => x.month || x.label),
        datasets: [
          { label: 'Income', data: monthly.map((x) => Number(x.income || 0)), backgroundColor: '#10b981' },
          { label: 'Expenses', data: monthly.map((x) => Number(x.expenses || 0)), backgroundColor: '#ef4444' }
        ]
      },
      options: { responsive: true, plugins: { legend: { labels: { color: '#8fa3c8' } } }, scales: { x: { ticks: { color: '#8fa3c8' }, grid: { display: false } }, y: { ticks: { color: '#8fa3c8' }, grid: { color: 'rgba(255,255,255,0.08)' } } } }
    });
  }, [monthly]);

  useEffect(() => {
    if (!window.Chart || !doughnutRef.current) return;
    if (doughnutChart.current) doughnutChart.current.destroy();
    doughnutChart.current = new window.Chart(doughnutRef.current, {
      type: 'doughnut',
      data: {
        labels: categories.map((x) => x.category || x.name || 'Category'),
        datasets: [{ data: categories.map((x) => Number(x.amount || x.total || 0)), backgroundColor: ['#4f8ef7', '#7c3aed', '#06d6a0', '#f59e0b', '#ef4444'] }]
      },
      options: { responsive: true, plugins: { legend: { labels: { color: '#8fa3c8' } } } }
    });
  }, [categories]);

  const savingsRate = useMemo(() => {
    const income = Number(summary?.total_income || summary?.income || 0);
    const expenses = Number(summary?.total_expenses || summary?.expenses || 0);
    return income ? (((income - expenses) / income) * 100).toFixed(1) : '0.0';
  }, [summary]);

  const income = Number(summary?.total_income || summary?.income || 0);
  const expenses = Number(summary?.total_expenses || summary?.expenses || 0);
  const savings = Number(summary?.net_savings || summary?.savings || income - expenses);

  return (
    <div>
      <div className="page-head">
        <h1>Dashboard</h1>
        <div className="head-actions">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          <span className="badge">{user?.preferred_currency || 'USD'}</span>
        </div>
      </div>
      <section className="stats-grid">
        <StatCard label="Total Income" value={money(income)} tone="green" />
        <StatCard label="Total Expenses" value={money(expenses)} tone="red" />
        <StatCard label="Net Savings" value={money(savings)} tone="blue" />
        <StatCard label="Savings Rate" value={`${savingsRate}%`} tone="amber" />
      </section>
      <section className="charts-grid">
        <div className="card"><h3>12-Month Trend</h3><canvas ref={barRef} /></div>
        <div className="card"><h3>Category Breakdown</h3>{categories.length ? <canvas ref={doughnutRef} /> : <EmptyState title="No category data" subtitle="Add transactions to visualize spending." />}</div>
      </section>
    </div>
  );
}
