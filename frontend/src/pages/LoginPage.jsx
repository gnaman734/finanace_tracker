import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiJSON, getToken, setToken } from '../lib/api';
import { useToast } from '../components/Toast';

export default function LoginPage({ callbackMode = false }) {
  const [tab, setTab] = useState('login');
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (callbackMode) {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (token) {
        setToken(token);
        navigate('/dashboard', { replace: true });
      }
      return;
    }
    if (getToken()) navigate('/dashboard', { replace: true });
  }, [callbackMode, navigate]);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      if (tab === 'register' && form.password !== form.confirmPassword) {
        setErr('Passwords do not match');
        return;
      }
      const path = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = tab === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const data = await apiJSON(path, { method: 'POST', body: JSON.stringify(body) });
      const token = data?.accessToken || data?.data?.accessToken;
      if (!token) throw new Error('Login succeeded but token missing');
      setToken(token);
      showToast(tab === 'login' ? 'Welcome back' : 'Account created', 'success');
      navigate('/dashboard');
    } catch (error) {
      setErr(error.message);
      showToast(error.message, 'error');
    }
  };

  return (
    <div className="login-page">
      <div className="card login-card">
        <h1 className="logo">FinTrack</h1>
        <p className="muted">Control your money with clarity.</p>
        <div className="tabs">
          <button className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Login</button>
          <button className={`tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Register</button>
        </div>
        <form onSubmit={onSubmit} className="form-grid">
          {tab === 'register' && <input name="name" placeholder="Name" value={form.name} onChange={onChange} required />}
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={onChange} required />
          {tab === 'register' && (
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={onChange}
              required
            />
          )}
          {err && <p className="error-text">{err}</p>}
          <button className="btn btn-primary" type="submit">{tab === 'login' ? 'Login' : 'Create Account'}</button>
        </form>
        <div className="divider"><span>or</span></div>
        <button className="btn" onClick={() => (window.location.href = '/api/auth/google')}>Continue with Google</button>
      </div>
    </div>
  );
}
