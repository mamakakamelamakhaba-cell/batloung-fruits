import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(false);
  const [showPw, setShowPw]     = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      await login(email, password);
      nav('/');
    } catch (err) {
      setError(err.friendlyMessage || err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally { setBusy(false); }
  };

  const fillDemo = (type) => {
    if (type === 'admin') { setEmail('admin@batloung.co.ls'); setPassword('admin123'); }
    else                  { setEmail('sales@batloung.co.ls'); setPassword('sales123'); }
    setError('');
  };

  return (
    <div className="login-shell">
      {/* LEFT — Sign-in form */}
      <div className="login-left">
        <div className="login-card">

          {/* Brand mark */}
          <div className="login-brand-row">
            <div className="login-brand-badge">
              <img
                src="/images/logo.jpg"
                alt="Batloung Fruits"
                onError={(e) => { e.target.style.display='none'; e.target.parentNode.innerHTML='🍃'; }}
              />
            </div>
            <div>
              <div className="login-brand-name">Batloung Fruits</div>
              <div className="login-brand-sub">Distribution Management</div>
            </div>
          </div>

          {/* Heading */}
          <div className="login-heading">Sign in to your account</div>

          {/* Error */}
          {error && <div className="login-error-bar">{error}</div>}

          <form onSubmit={submit} className="login-form">
            <div className="lf-group">
              <label className="lf-label" htmlFor="lf-email">Email address</label>
              <input
                id="lf-email"
                className="lf-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@batloung.co.ls"
                autoComplete="username"
                required
              />
            </div>

            <div className="lf-group">
              <div className="lf-label-row">
                <label className="lf-label" htmlFor="lf-password">Password</label>
              </div>
              <div className="lf-pw-wrap">
                <input
                  id="lf-password"
                  className="lf-input"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="lf-pw-toggle"
                  onClick={() => setShowPw(v => !v)}
                  tabIndex={-1}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? '○' : '●'}
                </button>
              </div>
            </div>

            <button
              id="login-btn"
              className="lf-submit"
              type="submit"
              disabled={busy}
            >
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="login-demo-section">
            <div className="login-demo-title">Demo accounts</div>
            <div className="login-demo-cards">
              <button className="login-demo-card" onClick={() => fillDemo('admin')} type="button">
                <span className="login-demo-role">Administrator</span>
                <span className="login-demo-email">admin@batloung.co.ls</span>
              </button>
              <button className="login-demo-card" onClick={() => fillDemo('sales')} type="button">
                <span className="login-demo-role">Sales Rep</span>
                <span className="login-demo-email">sales@batloung.co.ls</span>
              </button>
            </div>
            <div className="login-demo-hint">Click a card above to auto-fill credentials</div>
          </div>
        </div>
      </div>

      {/* RIGHT — Hero panel */}
      <div className="login-right">
        <img
          src="/images/login_hero.jpg"
          alt="Fresh Fruit Orchards"
          className="login-hero-img"
          onError={(e) => { e.target.src = '/images/hero-fruit.jpg'; }}
        />
        <div className="login-right-overlay">
          <div className="login-right-content">
            <div className="login-right-badge">Est. Maseru, Lesotho</div>
            <h2 className="login-right-h2">
              Fresh Produce<br />
              <span>From Farm to Vendor</span>
            </h2>
            <p className="login-right-p">
              Sourced from 9 South African provinces. Delivered fresh
              to street vendors across Maseru daily.
            </p>
            <div className="login-right-stats">
              <div className="login-right-stat">
                <div className="login-right-stat-val">12+</div>
                <div className="login-right-stat-lbl">Fruit Varieties</div>
              </div>
              <div className="login-stat-divider" />
              <div className="login-right-stat">
                <div className="login-right-stat-val">9</div>
                <div className="login-right-stat-lbl">SA Provinces</div>
              </div>
              <div className="login-stat-divider" />
              <div className="login-right-stat">
                <div className="login-right-stat-val">14+</div>
                <div className="login-right-stat-lbl">Active Vendors</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
