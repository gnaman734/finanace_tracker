const BASE_URL = '';
export const getToken = () => localStorage.getItem('accessToken');
export const setToken = (t) => localStorage.setItem('accessToken', t);
export const removeToken = () => localStorage.removeItem('accessToken');

let isRefreshing = false;

export const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers, credentials: 'include' });

  if (res.status === 401 && !isRefreshing) {
    isRefreshing = true;
    try {
      const r = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      if (r.ok) {
        const data = await r.json();
        setToken(data.accessToken);
        isRefreshing = false;
        headers.Authorization = `Bearer ${data.accessToken}`;
        return fetch(`${BASE_URL}${path}`, { ...options, headers, credentials: 'include' });
      }
    } catch {}
    isRefreshing = false;
    removeToken();
    window.location.href = '/';
    return null;
  }
  return res;
};

export const apiJSON = async (path, options = {}) => {
  const res = await apiFetch(path, options);
  if (!res) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
};
