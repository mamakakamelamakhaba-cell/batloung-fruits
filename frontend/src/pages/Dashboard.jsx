import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { money } from '../api/client';
import { fruitImg } from '../api/fruitImg.js';
import PageHeader from '../components/PageHeader.jsx';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Area, AreaChart, Legend
} from 'recharts';

const statusColors = {
  Completed:  { bg: '#d1fae5', color: '#065f46' },
  Pending:    { bg: '#fef3c7', color: '#92400e' },
  Processing: { bg: '#dbeafe', color: '#1e40af' },
  Cancelled:  { bg: '#fee2e2', color: '#991b1b' },
};

export default function Dashboard() {
  const nav = useNavigate();
  const [s, setS]             = useState(null);
  const [byFruit, setByFruit] = useState([]);
  const [byDate, setByDate]   = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [purchases, setPurchases] = useState(null);

  useEffect(() => {
    api.get('/reports/dashboard').then(r => setS(r.data)).catch(() => {});
    api.get('/reports/sales-by-fruit').then(r => setByFruit(r.data)).catch(() => {});
    api.get('/reports/sales-by-date').then(r =>
      setByDate(r.data.map(d => ({ ...d, order_date: String(d.order_date).slice(0, 10) })))
    ).catch(() => {});
    // Load recent real orders from API
    api.get('/orders', { params: { limit: 5 } }).then(r => setRecentOrders(r.data.slice(0, 5))).catch(() => {});
    api.get('/reports/purchases-summary').then(r => setPurchases(r.data)).catch(() => {});
  }, []);

  const cards = [
    {
      label: 'Total Fruits',
      value: s?.total_fruits ?? '—',
      icon: '/images/apple.jpg',
      iconType: 'img',
      color: 'green',
      trend: 'Varieties sourced',
      up: null,
    },
    {
      label: 'Suppliers',
      value: s?.total_suppliers ?? '—',
      icon: '🚛',
      color: 'blue',
      trend: 'Across SA provinces',
      up: null,
    },
    {
      label: 'Active Vendors',
      value: s?.total_vendors ?? '—',
      icon: '🏪',
      color: 'purple',
      trend: 'In Maseru',
      up: null,
    },
    {
      label: 'Stock Available',
      value: s ? `${s.available_stock}` : '—',
      icon: '📦',
      color: 'orange',
      trend: 'boxes in warehouse',
      up: null,
    },
    {
      label: 'Total Orders',
      value: s?.total_orders ?? '—',
      icon: '🛒',
      color: 'green',
      trend: `${s?.pending_orders ?? 0} pending`,
      up: true,
    },
    {
      label: 'Completed Orders',
      value: s?.completed_orders ?? '—',
      icon: '✅',
      color: 'green',
      trend: 'Fulfilled successfully',
      up: true,
    },
    {
      label: 'Pending Orders',
      value: s?.pending_orders ?? '—',
      icon: '⏳',
      color: 'gold',
      trend: 'Awaiting processing',
      up: false,
    },
    {
      label: 'Total Revenue',
      value: s ? money(s.sales_value) : '—',
      icon: '💰',
      color: 'gold',
      trend: 'Total sales value',
      up: true,
    },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#fff', border: '1px solid #D9E5DC',
          borderRadius: '10px', padding: '10px 14px', fontSize: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontWeight: 700, color: '#0B2519', marginBottom: '4px' }}>{label}</div>
          <div style={{ color: '#d97d0c', fontWeight: 600 }}>{money(payload[0]?.value)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* HERO */}
      <div className="hero">
        <div className="hero-text">
          <div className="hero-eyebrow">Live Dashboard</div>
          <h1>Fresh Produce for a<br /><span>Healthier Tomorrow</span></h1>
          <p>
            Quality fruits sourced from trusted South African suppliers,
            distributed to vendors across Maseru, Lesotho.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => nav('/reports')}>
              📈 View Full Reports
            </button>
            <button className="btn-ghost" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
              onClick={() => nav('/orders')}>
              New Order
            </button>
          </div>
        </div>
        <div className="hero-img-wrap">
          <div className="hero-img-overlay"></div>
          <img
            src="/images/fruits_market.jpg"
            alt="Fresh Fruits Market"
            className="hero-img"
            onError={(e) => { e.target.src = '/images/hero-fruit.jpg'; }}
          />
        </div>
      </div>

      {/* STATS GRID */}
      <div className="card-grid">
        {cards.map(c => (
          <div key={c.label} className="stat-card" style={{ '--card-accent': c.color === 'gold' ? 'rgba(248,152,32,0.08)' : undefined }}>
            <div className={`stat-icon-wrap ${c.color}`}>
              {c.iconType === 'img'
                ? <img src={c.icon} alt="" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} onError={e => e.target.src='/images/orange.jpg'} />
                : <span style={{ fontSize: '22px' }}>{c.icon}</span>
              }
            </div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
            {c.trend && (
              <div className={`stat-trend ${c.up === true ? 'up' : c.up === false ? 'down' : 'neu'}`}>
                {c.up === true ? '↑' : c.up === false ? '↓' : '·'} {c.trend}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* PURCHASES SUMMARY STRIP */}
      {purchases && Number(purchases.total_purchases) > 0 && (
        <div style={{
          display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap',
          background: 'linear-gradient(135deg,#0B2519,#1d4b2f)',
          borderRadius: '14px', padding: '18px 24px', alignItems: 'center',
        }}>
          <span style={{ fontSize: '22px' }}>📥</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Stock Purchases</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px', marginTop: '2px' }}>
              {purchases.total_purchases} purchase{Number(purchases.total_purchases) !== 1 ? 's' : ''} · {purchases.total_boxes} boxes received
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Total Cost</div>
            <div style={{ color: '#FBB040', fontWeight: 800, fontSize: '20px', fontFamily: 'Outfit,sans-serif' }}>{money(purchases.total_cost)}</div>
          </div>
        </div>
      )}

      {/* CHARTS ROW */}
      <div className="charts-grid" style={{ marginBottom: '24px' }}>
        <div className="chart-panel">
          <div className="chart-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '8px', background: '#fef3c7', marginRight: '4px' }}>🍋</span>
            Revenue by Fruit
          </div>
          {byFruit.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>📊</div>
              No sales data yet — place orders to see data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byFruit} barCategoryGap="30%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="fruit" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b8070', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b8070' }} tickFormatter={v => `M${(v/1000).toFixed(0)}k`} width={52} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(11,37,25,0.04)' }} />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="url(#barGrad)" barSize={40} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F89820" />
                    <stop offset="100%" stopColor="#d97d0c" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-panel">
          <div className="chart-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '8px', background: '#dcfce7', marginRight: '4px' }}>📅</span>
            Daily Revenue Trend
          </div>
          {byDate.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>📈</div>
              No trend data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={byDate} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3a8c55" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3a8c55" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eaf2eb" vertical={false} />
                <XAxis dataKey="order_date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b8070' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b8070' }} tickFormatter={v => `M${v}`} width={52} />
                <Tooltip
                  formatter={(v) => [money(v), 'Revenue']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #D9E5DC', fontSize: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3a8c55"
                  strokeWidth={3}
                  fill="url(#areaGrad)"
                  dot={{ r: 4, fill: '#3a8c55', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: '#F89820' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* RECENT ORDERS + TOP FRUITS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', marginBottom: '24px' }}>
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">🛒 Recent Orders</div>
            <button className="btn-ghost" style={{ fontSize: '13px', padding: '7px 14px' }} onClick={() => nav('/orders')}>
              View All →
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={4}>
                  <div className="table-empty" style={{ padding: '32px' }}>
                    <div className="table-empty-icon">🛒</div>
                    <div className="table-empty-msg">No orders yet</div>
                  </div>
                </td></tr>
              ) : recentOrders.map(o => {
                const sc = statusColors[o.status] || { bg: '#f3f4f6', color: '#4b5563' };
                return (
                  <tr key={o.id}>
                    <td className="cell-primary" style={{ fontFamily: 'monospace', fontSize: '13px' }}>#{String(o.id).padStart(3, '0')}</td>
                    <td>{o.vendor_name || o.vendor || '—'}</td>
                    <td className="fw-700 color-forest">{money(o.total_amount)}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700,
                        background: sc.bg, color: sc.color,
                      }}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* TOP FRUITS PANEL */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">🏆 Top Fruits</div>
          </div>
          <div style={{ padding: '12px 0' }}>
            {byFruit.slice(0, 5).map((f, i) => (
              <div key={f.fruit} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 20px',
                borderBottom: i < 4 ? '1px solid var(--border-light)' : 'none'
              }}>
                <div style={{
                  width: '28px', height: '28px',
                  borderRadius: '8px',
                  background: i === 0 ? '#fef3c7' : i === 1 ? '#f3f4f6' : i === 2 ? '#ffedd5' : 'var(--bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '12px',
                  color: i === 0 ? '#92400e' : '#6b8070',
                  flexShrink: 0,
                }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                </div>
                <img
                  src={fruitImg(f.fruit)}
                  alt={f.fruit}
                  style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  onError={e => e.target.src = '/images/orange.jpg'}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--forest)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.fruit}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{f.boxes_sold || 0} boxes sold</div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold-dark)', whiteSpace: 'nowrap' }}>
                  {money(f.revenue)}
                </div>
              </div>
            ))}
            {byFruit.length === 0 && (
              <div className="table-empty">
                <div className="table-empty-icon">🍊</div>
                <div className="table-empty-msg">No sales data yet</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER BANNER */}
      <div className="footer-banner">
        <div>
          <div className="footer-banner-logo">Batloung<span> Fruits</span></div>
          <div className="footer-banner-tag">Freshness You Can Trust — Maseru, Lesotho</div>
        </div>
        <div className="footer-feats">
          <div className="footer-feat">
            <img src="/images/fruits_market.jpg" alt="Fresh" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', margin: '0 auto 8px', display: 'block' }} onError={e => { e.target.src='/images/apple.jpg'; }} />
            <div className="footer-feat-lbl">Fresh Produce</div>
          </div>
          <div className="footer-feat">
            <img src="/images/suppliers_truck.jpg" alt="Suppliers" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', margin: '0 auto 8px', display: 'block' }} onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML = '<div style="font-size:28px;margin-bottom:8px">🚚</div><div class="footer-feat-lbl">Reliable Suppliers</div>'; }} />
            <div className="footer-feat-lbl">Reliable Suppliers</div>
          </div>
          <div className="footer-feat">
            <img src="/images/vendor_portrait.jpg" alt="Vendors" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', margin: '0 auto 8px', display: 'block' }} onError={e => { e.target.src='/images/vendors.jpg'; }} />
            <div className="footer-feat-lbl">Happy Vendors</div>
          </div>
          <div className="footer-feat">
            <img src="/images/analytics_dashboard.jpg" alt="Analytics" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', margin: '0 auto 8px', display: 'block' }} onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML = '<div style="font-size:28px;margin-bottom:8px">📈</div><div class="footer-feat-lbl">Smart Reports</div>'; }} />
            <div className="footer-feat-lbl">Smart Reports</div>
          </div>
        </div>
      </div>
    </div>
  );
}
