import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
  AreaChart, Area
} from 'recharts';
import api, { money } from '../api/client';
import { fruitImg } from '../api/fruitImg.js';
import PageHeader from '../components/PageHeader.jsx';

const PIE_COLORS = ['#F89820','#3a8c55','#1e40af','#5b21b6','#dc2626','#0891b2','#d97706','#7c3aed'];

const BOX_SIZES = ['All', 'Small', 'Medium', 'Large'];

const SIZE_BADGE = {
  All:    { bg: '#f3f4f6', color: '#374151' },
  Small:  { bg: '#dcfce7', color: '#166534' },
  Medium: { bg: '#dbeafe', color: '#1e40af' },
  Large:  { bg: '#fef3c7', color: '#92400e' },
};

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid #D9E5DC',
  fontSize: '12px',
  boxShadow: '0 8px 24px rgba(11,37,25,0.12)',
  background: '#fff',
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ ...tooltipStyle, padding: '10px 14px' }}>
        <div style={{ fontWeight: 700, color: '#0B2519', marginBottom: '4px', fontSize: '13px' }}>{label}</div>
        <div style={{ color: '#d97d0c', fontWeight: 600 }}>{money(payload[0]?.value)}</div>
      </div>
    );
  }
  return null;
};

const CustomLineTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ ...tooltipStyle, padding: '10px 14px' }}>
        <div style={{ fontWeight: 600, color: '#6b8070', marginBottom: '4px', fontSize: '11px' }}>{label}</div>
        <div style={{ color: '#3a8c55', fontWeight: 700 }}>{money(payload[0]?.value)}</div>
      </div>
    );
  }
  return null;
};

export default function Reports() {
  // box size filter for the fruit sales section
  const [boxFilter, setBoxFilter] = useState('All');
  // box size filter for the stock table (client-side)
  const [stockFilter, setStockFilter] = useState('All');

  const [byFruit,    setByFruit]    = useState([]);
  const [byVendor,   setByVendor]   = useState([]);
  const [byProvince, setByProvince] = useState([]);
  const [byDate,     setByDate]     = useState([]);
  const [stock,      setStock]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [fruitLoading, setFruitLoading] = useState(false);

  // Load fruit sales with optional box_size query param
  const loadFruitSales = useCallback((size) => {
    setFruitLoading(true);
    const params = size !== 'All' ? { box_size: size } : {};
    api.get('/reports/sales-by-fruit', { params })
      .then(r => setByFruit(r.data))
      .catch(() => setByFruit([]))
      .finally(() => setFruitLoading(false));
  }, []);

  useEffect(() => {
    // Load all non-filterable reports in parallel
    Promise.all([
      api.get('/reports/sales-by-vendor').then(r => setByVendor(r.data)),
      api.get('/reports/purchases-by-province').then(r => setByProvince(r.data)),
      api.get('/reports/sales-by-date').then(r =>
        setByDate(r.data.map(d => ({ ...d, order_date: String(d.order_date).slice(0, 10) })))
      ),
      api.get('/reports/available-stock').then(r => setStock(r.data)),
    ]).catch(() => {}).finally(() => setLoading(false));

    // Initial fruit sales load (all sizes)
    loadFruitSales('All');
  }, [loadFruitSales]);

  // Re-fetch fruit sales whenever the box filter changes
  const handleBoxFilter = (size) => {
    setBoxFilter(size);
    loadFruitSales(size);
  };

  const totalRev   = byFruit.reduce((s, f) => s + Number(f.revenue || 0), 0);
  const totalBoxes = byFruit.reduce((s, f) => s + Number(f.boxes_sold || 0), 0);
  const totalCost  = byProvince.reduce((s, p) => s + Number(p.cost || 0), 0);

  const EmptyChart = ({ icon, msg }) => (
    <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '40px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '13px' }}>{msg}</div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="📊 Analytics & Reports"
        subtitle="Comprehensive overview of sales, purchasing, and inventory"
        actions={
          <button className="btn-primary" onClick={() => window.print()}>
            🖨️ Export Report
          </button>
        }
      />

      {/* Summary cards */}
      <div className="summary-grid" style={{ marginBottom: '28px' }}>
        <div className="summary-card" style={{ background: 'linear-gradient(135deg,#0B2519,#1d4b2f)' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '8px' }}>Total Sales Revenue</div>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '32px', fontWeight: 800, color: '#FBB040' }}>{money(totalRev)}</div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>From all completed orders</div>
        </div>
        <div className="summary-card" style={{ background: 'linear-gradient(135deg,#1e40af,#2563eb)' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '8px' }}>Total Boxes Sold</div>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '32px', fontWeight: 800, color: '#93c5fd' }}>{totalBoxes.toLocaleString()}</div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            {boxFilter === 'All' ? 'Across all box sizes' : `${boxFilter} boxes only`}
          </div>
        </div>
        <div className="summary-card" style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '8px' }}>Total Purchase Cost</div>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '32px', fontWeight: 800, color: '#c4b5fd' }}>{money(totalCost)}</div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Paid to SA suppliers</div>
        </div>
      </div>

      {/* CHARTS ROW 1 — Revenue Trend & Province purchases */}
      <div className="charts-grid" style={{ marginBottom: '24px' }}>
        <div className="chart-panel">
          <div className="chart-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '8px', background: '#fef3c7', marginRight: '6px', fontSize: '14px' }}>📅</span>
            Revenue Trend Over Time
          </div>
          {byDate.length === 0
            ? <EmptyChart icon="📈" msg="No revenue trend data available yet" />
            : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={byDate} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F89820" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#F89820" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eaf2eb" vertical={false} />
                  <XAxis dataKey="order_date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b8070' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b8070' }} tickFormatter={v => `M${v}`} width={52} />
                  <Tooltip content={<CustomLineTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#F89820" strokeWidth={3} fill="url(#revGrad)"
                    dot={{ r: 4, fill: '#F89820', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7, fill: '#3a8c55' }} />
                </AreaChart>
              </ResponsiveContainer>
            )
          }
        </div>

        <div className="chart-panel">
          <div className="chart-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '8px', background: '#dcfce7', marginRight: '6px', fontSize: '14px' }}>🌍</span>
            Purchases by Province
          </div>
          {byProvince.length === 0
            ? <EmptyChart icon="🌍" msg="No provincial purchase data yet" />
            : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byProvince} barCategoryGap="25%" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="provGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3a8c55" />
                      <stop offset="100%" stopColor="#1d4b2f" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eaf2eb" vertical={false} />
                  <XAxis dataKey="province" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b8070' }} angle={-20} textAnchor="end" height={40} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b8070' }} tickFormatter={v => `M${v}`} width={52} />
                  <Tooltip
                    formatter={(v, name) => [money(v), 'Purchase Cost']}
                    contentStyle={tooltipStyle}
                    cursor={{ fill: 'rgba(11,37,25,0.04)' }}
                  />
                  <Bar dataKey="cost" radius={[8, 8, 0, 0]} barSize={28} fill="url(#provGrad)" />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      {/* ── FRUIT SALES SECTION with Box Size Filter ── */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        {/* Panel header with filter buttons */}
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="panel-title">
            🍎 Sales by Fruit
            {boxFilter !== 'All' && (
              <span style={{
                marginLeft: '10px', fontSize: '12px', fontWeight: 600,
                background: SIZE_BADGE[boxFilter].bg, color: SIZE_BADGE[boxFilter].color,
                borderRadius: '20px', padding: '2px 10px',
              }}>
                {boxFilter} boxes
              </span>
            )}
          </div>

          {/* Box Size Filter — pill buttons */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginRight: '4px' }}>Filter by box size:</span>
            {BOX_SIZES.map(size => {
              const active = boxFilter === size;
              const badge = SIZE_BADGE[size];
              return (
                <button
                  key={size}
                  onClick={() => handleBoxFilter(size)}
                  style={{
                    padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                    border: active ? `2px solid ${badge.color}` : '2px solid transparent',
                    background: active ? badge.bg : 'var(--bg-alt)',
                    color: active ? badge.color : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                >
                  {size === 'All' ? '🔍 All Sizes' : size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fruit sales chart */}
        <div style={{ padding: '0 20px 20px' }}>
          {fruitLoading ? (
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              <span style={{ fontSize: '30px', marginRight: '10px' }}>⏳</span> Loading…
            </div>
          ) : byFruit.length === 0 ? (
            <EmptyChart icon="🍊" msg={`No completed sales for ${boxFilter === 'All' ? 'any size' : boxFilter + ' boxes'} yet`} />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byFruit} barCategoryGap="25%" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eaf2eb" vertical={false} />
                <XAxis dataKey="fruit" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b8070', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b8070' }} tickFormatter={v => `M${v}`} width={52} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(11,37,25,0.04)' }} />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]} barSize={40}>
                  {byFruit.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Pie + Fruit Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px', marginBottom: '24px' }}>
        {/* Top Fruits Table — 1 row per fruit */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">🏆 Top Selling Fruits
              {boxFilter !== 'All' && (
                <span style={{
                  marginLeft: '8px', fontSize: '11px', fontWeight: 600,
                  background: SIZE_BADGE[boxFilter].bg, color: SIZE_BADGE[boxFilter].color,
                  borderRadius: '20px', padding: '2px 8px',
                }}>{boxFilter}</span>
              )}
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fruit</th>
                <th>Boxes Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {fruitLoading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Loading…</td></tr>
              ) : byFruit.map((r, i) => (
                <tr key={r.fruit}>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 28, height: 28, borderRadius: '8px',
                      background: i === 0 ? '#fef3c7' : i === 1 ? '#f3f4f6' : i === 2 ? '#ffedd5' : 'var(--bg)',
                      fontWeight: 800, fontSize: '12px',
                      color: i === 0 ? '#92400e' : '#6b8070',
                    }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </span>
                  </td>
                  <td>
                    <div className="fruit-cell">
                      <img
                        src={fruitImg(r.fruit)}
                        alt={r.fruit}
                        className="fruit-cell-img"
                        style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                        onError={e => e.target.src='/images/orange.jpg'}
                      />
                      <span className="cell-primary" style={{ fontWeight: 700 }}>{r.fruit}</span>
                    </div>
                  </td>
                  <td><span className="badge info">{r.boxes_sold} boxes</span></td>
                  <td className="fw-700 color-forest">{money(r.revenue)}</td>
                </tr>
              ))}
              {!fruitLoading && byFruit.length === 0 && (
                <tr><td colSpan={4}>
                  <div className="table-empty">
                    <div className="table-empty-icon">📊</div>
                    <div className="table-empty-msg">No sales data for selected filter</div>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Revenue Share Pie */}
        <div className="chart-panel">
          <div className="chart-title">🥧 Revenue Share by Fruit</div>
          {byFruit.length === 0 ? (
            <EmptyChart icon="🥧" msg="No data for selected filter" />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={byFruit}
                  dataKey="revenue"
                  nameKey="fruit"
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {byFruit.map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={v => [money(v), 'Revenue']}
                  contentStyle={tooltipStyle}
                />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  formatter={(value) => <span style={{ color: 'var(--text-sec)', fontWeight: 600 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Vendors table */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <div className="panel-title">🏪 Top Street Vendors</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Orders</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {byVendor.map((r, i) => (
              <tr key={i}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${PIE_COLORS[i % PIE_COLORS.length]}22, ${PIE_COLORS[i % PIE_COLORS.length]}44)`,
                      border: `2px solid ${PIE_COLORS[i % PIE_COLORS.length]}66`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(r.vendor || 'V')}&size=38&bold=true&format=png&background=${PIE_COLORS[i % PIE_COLORS.length].replace('#','')}&color=fff`}
                        alt={r.vendor}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <div>
                      <div className="cell-primary">{r.vendor}</div>
                      <div className="cell-sub">{r.business_name}</div>
                    </div>
                  </div>
                </td>
                <td><span className="badge ok">{r.orders} orders</span></td>
                <td className="fw-700 color-forest">{money(r.revenue)}</td>
              </tr>
            ))}
            {byVendor.length === 0 && (
              <tr><td colSpan={3}>
                <div className="table-empty">
                  <div className="table-empty-icon">🏪</div>
                  <div className="table-empty-msg">No vendor sales yet</div>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Current Stock table — with box size filter, 1 fruit per row */}
      <div className="panel">
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="panel-title">
            📦 Current Available Stock
            {stockFilter !== 'All' && (
              <span style={{
                marginLeft: '10px', fontSize: '12px', fontWeight: 600,
                background: SIZE_BADGE[stockFilter].bg, color: SIZE_BADGE[stockFilter].color,
                borderRadius: '20px', padding: '2px 10px',
              }}>
                {stockFilter} boxes
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginRight: '4px' }}>Filter by box size:</span>
            {BOX_SIZES.map(size => {
              const active = stockFilter === size;
              const badge = SIZE_BADGE[size];
              return (
                <button
                  key={size}
                  onClick={() => setStockFilter(size)}
                  style={{
                    padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                    border: active ? `2px solid ${badge.color}` : '2px solid transparent',
                    background: active ? badge.bg : 'var(--bg-alt)',
                    color: active ? badge.color : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                >
                  {size === 'All' ? '🔍 All Sizes' : size}
                </button>
              );
            })}

            {/* Low stock warning badge */}
            {stock.filter(s => s.stock_quantity < 20).length > 0 && (
              <span style={{ background: '#fee2e2', color: '#991b1b', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, marginLeft: '8px' }}>
                ⚠️ {stock.filter(s => s.stock_quantity < 20).length} low-stock items
              </span>
            )}
          </div>
        </div>

        {(() => {
          // Build the display rows based on stockFilter
          let rows;
          if (stockFilter === 'All') {
            // Group by fruit — show total stock across all sizes, and price range
            const grouped = {};
            stock.forEach(s => {
              const name = s.fruit || s.fruit_name;
              if (!grouped[name]) grouped[name] = { fruit: name, total_qty: 0, min_price: s.selling_price, max_price: s.selling_price, low: false, sizes: [] };
              grouped[name].total_qty += Number(s.stock_quantity);
              grouped[name].min_price = Math.min(grouped[name].min_price, Number(s.selling_price));
              grouped[name].max_price = Math.max(grouped[name].max_price, Number(s.selling_price));
              if (s.stock_quantity < 20) grouped[name].low = true;
              grouped[name].sizes.push({ size: s.box_size, qty: s.stock_quantity });
            });
            rows = Object.values(grouped);
          } else {
            // Filter by selected box size — 1 row per fruit for that size
            rows = stock
              .filter(s => s.box_size === stockFilter)
              .map(s => ({
                fruit: s.fruit || s.fruit_name,
                total_qty: Number(s.stock_quantity),
                min_price: Number(s.selling_price),
                max_price: Number(s.selling_price),
                low: s.stock_quantity < 20,
                sizes: [{ size: s.box_size, qty: s.stock_quantity }],
              }));
          }

          const maxQty = rows.reduce((m, r) => Math.max(m, r.total_qty), 1);

          return (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fruit</th>
                  {stockFilter === 'All'
                    ? <th>Price Range</th>
                    : <th>Selling Price ({stockFilter})</th>
                  }
                  {stockFilter === 'All' && <th>Sizes</th>}
                  <th>Stock Available</th>
                  <th style={{ width: '180px' }}>Stock Level</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const pct = Math.min(100, (r.total_qty / maxQty) * 100);
                  return (
                    <tr key={i}>
                      <td>
                        <div className="fruit-cell">
                          <img
                            src={fruitImg(r.fruit)}
                            alt={r.fruit}
                            className="fruit-cell-img"
                            style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                            onError={e => e.target.src = '/images/orange.jpg'}
                          />
                          <span className="cell-primary" style={{ fontWeight: 700 }}>{r.fruit}</span>
                        </div>
                      </td>
                      <td className="fw-700 color-forest">
                        {r.min_price === r.max_price
                          ? money(r.min_price)
                          : <>{money(r.min_price)} – {money(r.max_price)}</>
                        }
                      </td>
                      {stockFilter === 'All' && (
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {r.sizes.map(s => (
                              <span key={s.size} style={{
                                fontSize: '11px', fontWeight: 700, padding: '2px 8px',
                                borderRadius: '20px',
                                background: s.size === 'Small' ? '#dcfce7' : s.size === 'Medium' ? '#dbeafe' : '#fef3c7',
                                color: s.size === 'Small' ? '#166534' : s.size === 'Medium' ? '#1e40af' : '#92400e',
                              }}>
                                {s.size}: {s.qty}
                              </span>
                            ))}
                          </div>
                        </td>
                      )}
                      <td style={{ color: r.low ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                        {r.total_qty} boxes
                        {r.low && <span className="badge danger" style={{ marginLeft: '6px', fontSize: '10px' }}>⚠️ Low</span>}
                      </td>
                      <td style={{ width: '180px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '8px', background: 'var(--bg-alt)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', width: `${pct}%`, borderRadius: '10px',
                              background: r.low
                                ? 'linear-gradient(90deg,#ef4444,#f97316)'
                                : 'linear-gradient(90deg,var(--leaf),var(--gold))',
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '28px', textAlign: 'right' }}>{Math.round(pct)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr><td colSpan={stockFilter === 'All' ? 5 : 4}>
                    <div className="table-empty">
                      <div className="table-empty-icon">📦</div>
                      <div className="table-empty-msg">No stock data for selected size</div>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          );
        })()}
      </div>
    </div>
  );
}
