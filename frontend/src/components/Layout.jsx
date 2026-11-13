import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  IconDashboard, IconFruits, IconProducts, IconSuppliers,
  IconStock, IconOrders, IconVendors, IconReports, IconBoxSizes
} from './Icons.jsx';

const NAV_ITEMS_ADMIN = [
  { to: '/',          Icon: IconDashboard,  label: 'Dashboard',  exact: true,  color: '#F89820' },
  { to: '/fruits',    Icon: IconFruits,     label: 'Fruits',                   color: '#5aac73' },
  { to: '/products',  Icon: IconProducts,   label: 'Products',                 color: '#FBB040' },
  { to: '/suppliers', Icon: IconSuppliers,  label: 'Suppliers',                color: '#60a5fa' },
  { to: '/boxsizes',  Icon: IconBoxSizes,   label: 'Box Sizes',                color: '#c084fc' },
  { to: '/stock',     Icon: IconStock,      label: 'Stock',                    color: '#34d399' },
  { to: '/orders',    Icon: IconOrders,     label: 'Orders',                   color: '#f87171' },
  { to: '/vendors',   Icon: IconVendors,    label: 'Vendors',                  color: '#fb923c' },
  { to: '/reports',   Icon: IconReports,    label: 'Reports',                  color: '#a3e635' },
];

const NAV_ITEMS_SALES = [
  { to: '/',         Icon: IconDashboard,  label: 'Dashboard', exact: true, color: '#F89820' },
  { to: '/products', Icon: IconProducts,   label: 'Products',               color: '#FBB040' },
  { to: '/vendors',  Icon: IconVendors,    label: 'Vendors',                color: '#fb923c' },
  { to: '/orders',   Icon: IconOrders,     label: 'Orders',                 color: '#f87171' },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme, fontSize, setFontSize, sidebarCollapsed, toggleSidebar } = useTheme();
  const nav = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLogout = () => { logout(); nav('/login'); };
  const items = isAdmin ? NAV_ITEMS_ADMIN : NAV_ITEMS_SALES;

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  };

  const pageName = items.find(i => isActive(i))?.label || 'Dashboard';
  const isDark = theme === 'dark';

  return (
    <div className={`shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="brand">
          <div className="brand-logo">
            <img
              src="/images/logo.jpg"
              alt="Batloung Fruits"
              onError={(e) => { e.target.style.display='none'; e.target.parentNode.innerHTML='<span style="font-size:28px">🍏</span>'; }}
            />
          </div>
          {!sidebarCollapsed && (
            <div className="brand-text">
              <div className="brand-name">Batloung Fruits</div>
              <div className="brand-tagline">Freshness You Can Trust</div>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button className="sidebar-collapse-btn" onClick={toggleSidebar} title={sidebarCollapsed ? 'Expand' : 'Collapse'}>
          {sidebarCollapsed ? '›' : '‹'}
        </button>

        {/* Nav */}
        <nav className="sidebar-nav">
          {!sidebarCollapsed && <div className="nav-section-label">Navigation</div>}
          {items.map(item => {
            const active = isActive(item);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={() => 'nav-item' + (active ? ' active' : '')}
                title={sidebarCollapsed ? item.label : ''}
              >
                <span className="nav-icon" style={{ '--icon-accent': item.color }}>
                  <item.Icon />
                </span>
                {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
                {!sidebarCollapsed && active && <span className="nav-active-dot" />}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {!sidebarCollapsed && (
            <div className="user-chip">
              <img
                src="/images/avatar.jpg"
                alt={user?.name}
                className="user-chip-avatar"
                onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name||'Admin')}&background=0B2519&color=fff`}
              />
              <div className="user-chip-info">
                <div className="user-chip-name">{user?.name || 'Admin'}</div>
                <div className="user-chip-role">{user?.role || 'Administrator'}</div>
              </div>
            </div>
          )}
          <button className="btn-logout" onClick={handleLogout} title="Sign Out">
            <span style={{ fontSize: '15px', opacity: 0.8 }}>⇥</span>
            {!sidebarCollapsed && ' Sign Out'}
          </button>
        </div>
      </aside>

      {/* ── CONTENT ── */}
      <div className="content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-page-title">{pageName}</div>
          </div>
          <div className="topbar-right">

            {/* Theme Toggle */}
            <button
              className="topbar-action-btn"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Settings */}
            <button
              className="topbar-action-btn"
              onClick={() => setSettingsOpen(true)}
              title="Settings"
            >
              ⚙️
            </button>

            {/* Notifications */}
            <div className="topbar-notif" title="Notifications">
              <span style={{ fontSize: '17px', lineHeight: 1 }}>🔔</span>
              <span className="notif-dot"></span>
            </div>

            {/* User */}
            <div className="topbar-user">
              <img
                src="/images/avatar.jpg"
                alt={user?.name}
                className="topbar-avatar"
                onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name||'A')}&background=0B2519&color=fff`}
              />
              <div>
                <div className="topbar-uname">{user?.name || 'Admin'}</div>
                <div className="topbar-urole">{user?.role || 'Administrator'}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-wrap">
          <Outlet />
        </main>
      </div>

      {/* ── SETTINGS PANEL ── */}
      {settingsOpen && (
        <div className="settings-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="settings-panel" role="dialog" aria-modal="true" aria-label="User settings" onClick={e => e.stopPropagation()}>
            <div className="settings-header">
              <div className="settings-title">⚙️ Settings</div>
              <button className="settings-close" type="button" aria-label="Close settings" onClick={() => setSettingsOpen(false)}>✕</button>
            </div>

            {/* Theme */}
            <div className="settings-section">
              <div className="settings-section-title">🎨 Appearance</div>
              <div className="settings-row">
                <span className="settings-label">Theme</span>
                <div className="settings-toggle-group">
                  <button
                    className={`settings-toggle-btn${!isDark ? ' active' : ''}`}
                    onClick={() => { if (isDark) toggleTheme(); }}
                  >
                    ☀️ Light
                  </button>
                  <button
                    className={`settings-toggle-btn${isDark ? ' active' : ''}`}
                    onClick={() => { if (!isDark) toggleTheme(); }}
                  >
                    🌙 Dark
                  </button>
                </div>
              </div>
            </div>

            {/* Font Size */}
            <div className="settings-section">
              <div className="settings-section-title">🔤 Text Size</div>
              <div className="settings-row">
                <span className="settings-label">Font Size</span>
                <div className="settings-toggle-group">
                  {['normal', 'large', 'xlarge'].map(sz => (
                    <button
                      key={sz}
                      className={`settings-toggle-btn${fontSize === sz ? ' active' : ''}`}
                      onClick={() => setFontSize(sz)}
                    >
                      {sz === 'normal' ? 'A' : sz === 'large' ? 'A+' : 'A++'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="settings-section">
              <div className="settings-section-title">📐 Layout</div>
              <div className="settings-row">
                <span className="settings-label">Sidebar</span>
                <div className="settings-toggle-group">
                  <button
                    className={`settings-toggle-btn${!sidebarCollapsed ? ' active' : ''}`}
                    onClick={() => { if (sidebarCollapsed) toggleSidebar(); }}
                  >
                    Expanded
                  </button>
                  <button
                    className={`settings-toggle-btn${sidebarCollapsed ? ' active' : ''}`}
                    onClick={() => { if (!sidebarCollapsed) toggleSidebar(); }}
                  >
                    Compact
                  </button>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="settings-section">
              <div className="settings-section-title">↺ Reset</div>
              <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Restore all appearance settings to their defaults.</div>
                <button
                  className="btn-ghost"
                  style={{ width: '100%', marginTop: '4px' }}
                  onClick={() => { setTheme('light'); setFontSize('normal'); if (sidebarCollapsed) toggleSidebar(); }}
                >
                  Reset to Defaults
                </button>
              </div>
            </div>

            {/* About */}
            <div className="settings-section">
              <div className="settings-section-title">ℹ️ About</div>
              <div className="settings-about">
                <div className="settings-about-logo">🍏 Batloung Fruits</div>
                <div className="settings-about-ver">Distribution Management System v2.0</div>
                <div className="settings-about-copy">© 2026 Batloung Fruits · DIWA2110</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
