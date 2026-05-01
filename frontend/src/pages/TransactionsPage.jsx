import { useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { apiFetch, apiJSON } from '../lib/api';
import { useUser } from '../App';

export default function TransactionsPage() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [fileMap, setFileMap] = useState({});
  const [form, setForm] = useState({ type: 'expense', amount: '', currency: 'USD', description: '', date: new Date().toISOString().slice(0, 10) });
  const { showToast } = useToast();
  const { setLoading } = useUser();

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiJSON('/api/transactions');
      setRows(data?.data || []);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createTx = async (e) => {
    e.preventDefault();
    try {
      await apiJSON('/api/transactions', { method: 'POST', body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
      setOpen(false);
      setForm({ type: 'expense', amount: '', currency: 'USD', description: '', date: new Date().toISOString().slice(0, 10) });
      showToast('Transaction created', 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const uploadReceipt = async (id) => {
    const file = fileMap[id];
    if (!file) return;
    const fd = new FormData();
    fd.append('receipt', file);
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`/api/transactions/${id}/receipt`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(err.message || 'Receipt upload failed', 'error');
      return;
    }
    showToast('Receipt uploaded', 'success');
    load();
  };

  const removeTx = async (id) => {
    try {
      await apiJSON(`/api/transactions/${id}`, { method: 'DELETE' });
      showToast('Transaction deleted', 'info');
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div>
      <div className="page-head"><h1>Transactions</h1><button className="btn btn-primary" onClick={() => setOpen(true)}>Add Transaction</button></div>
      {!rows.length ? <EmptyState title="No transactions" subtitle="Create your first transaction to start tracking." /> : (
        <div className="card table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Description</th><th>Type</th><th className="right">Amount</th><th>Receipt</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td><td>{r.description}</td><td>{r.type}</td><td className="right mono">{Number(r.amount).toLocaleString()} {r.currency}</td>
                  <td>
                    <div className="receipt-cell">
                      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFileMap((p) => ({ ...p, [r.id]: e.target.files?.[0] }))} />
                      <button className="btn btn-small" onClick={() => uploadReceipt(r.id)}>Upload</button>
                      {r.receipt_url && <a className="link" href={`/api/transactions/${r.id}/receipt`} target="_blank">View</a>}
                    </div>
                  </td>
                  <td><button className="btn btn-danger" onClick={() => removeTx(r.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} title="Create Transaction" onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={createTx}>
          <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}><option value="expense">Expense</option><option value="income">Income</option></select>
          <input type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} required />
          <input placeholder="Currency (USD)" value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value.toUpperCase() }))} required />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required />
          <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
          <button className="btn btn-primary" type="submit">Save</button>
        </form>
      </Modal>
    </div>
  );
}
