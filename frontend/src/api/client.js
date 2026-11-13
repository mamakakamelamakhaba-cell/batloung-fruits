import axios from 'axios';

// The API base URL is read at build time by Vite.
//  - Vercel: set VITE_API_URL = https://<your-backend>.onrender.com/api
//  - Local dev: leave it unset and the Vite proxy forwards /api to :5000
function resolveBaseURL() {
  const raw = (import.meta.env.VITE_API_URL || '').trim();
  if (!raw) return '/api';

  let url = raw.replace(/\/+$/, '');
  // Guard against the most common deployment mistake: pasting the ORIGIN only,
  // e.g. "https://my-api.onrender.com" — the routes live under /api.
  if (!/\/api$/i.test(url)) url = `${url}/api`;
  // Guard against "http://" on a https site (browser blocks it silently).
  if (typeof location !== 'undefined' && location.protocol === 'https:' && url.startsWith('http://')) {
    console.warn('[api] VITE_API_URL uses http:// on an https page — upgrading to https://');
    url = url.replace(/^http:\/\//, 'https://');
  }
  return url;
}

export const API_BASE_URL = resolveBaseURL();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('bf_token');
      localStorage.removeItem('bf_user');
      if (location.pathname !== '/login') location.href = '/login';
      return Promise.reject(err);
    }

    // Turn silent/opaque failures into something readable on the login screen.
    if (!err.response) {
      err.friendlyMessage = err.code === 'ECONNABORTED'
        ? 'The server took too long to respond. It may be waking up — try again.'
        : `Cannot reach the server at ${API_BASE_URL}. Check VITE_API_URL on Vercel and that the backend is live.`;
    } else if (err.response.status === 503) {
      err.friendlyMessage = err.response.data?.message
        || 'The server is up but its database is not ready. Run the database setup once.';
    } else if (err.response.status === 403 && /cors/i.test(err.response.data?.message || '')) {
      err.friendlyMessage = `This site's address is not allowed by the backend. Set CLIENT_ORIGIN to ${location.origin} on Render.`;
    }

    return Promise.reject(err);
  }
);

export default api;

// Format a number as Maloti currency (M)
export const money = (n) =>
  'M ' + Number(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
