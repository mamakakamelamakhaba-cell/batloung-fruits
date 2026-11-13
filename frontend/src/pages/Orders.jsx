import { useEffect, useState } from 'react';
import api, { money } from '../api/client';
import { fruitImg } from '../api/fruitImg.js';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

const STATUSES = ['Pending','Confirmed','Processing','Ready for Collection/Delivery','Completed','Cancelled'];

const statusMeta = {
  'Pending':                     { cls: 'warn',   icon: '⏳' },
  'Confirmed':                   { cls: 'info',   icon: '✔️' },
  'Processing':                  { cls: 'info',   icon: '⚙️' },
  'Ready for Collection/Delivery':{ cls: 'box',   icon: '📦' },
  'Completed':                   { cls: 'ok',     icon: '✅' },
  'Cancelled':                   { cls: 'off',    icon: '✕' },
};

const STEP_ORDER = ['Pending','Confirmed','Processing','Ready for Collection/Delivery','Completed'];

export default function Orders() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [rows, setRows]             = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [vendors, setVendors]       = useState([]);
  const [products, setProducts]     = useState([]);
  const [create, setCreate]         = useState(false);
  const [detail, setDetail]         = useState(null);
  const [err, setErr]               = useState('');

  const [vendorId, setVendorId] = useState('');
  const [items, setItems]       = useState([{ product_id: '', quantity: 1 }]);

  const load = () => api.get('/orders', { params: { status: statusFilter } }).then(r => setRows(r.data)).catch(() => {});
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter]);
  useEffect(() => {
    api.get('/vendors', { params: { status: 'Active' } }).then(r => setVendors(r.data)).catch(() => {});
    api.get('/products').then(r => setProducts(r.data)).catch(() => {});
  }, []);

  const addLine    = () => setItems([...items, { product_id: '', quantity: 1 }]);
  const removeLine = (i) => setItems(items.filter((_, idx) => idx !== i));
  const setLine    = (i, key, val) => setItems(items.map((it, idx) => idx === i ? { ...it, [key]: val } : it));

  const estTotal = items.reduce((sum, it) => {
    const p = products.find(pr => String(pr.id) === String(it.product_id));
    return sum + (p ? Number(p.selling_price) * Number(it.quantity || 0) : 0);
  }, 0);

  const submit = async () => {
    try {
      const clean = items.filter(i => i.product_id && i.quantity > 0);
      await api.post('/orders', { vendor_id: vendorId, items: clean });
      toast('🛒 Order placed successfully!', 'success');
      setCreate(false); setVendorId(''); setItems([{ product_id: '', quantity: 1 }]); load();
    } catch (e) { setErr(e.response?.data?.message || 'Could not create order'); }
  };

  const openDetail = async (id) => {
    const { data } = await api.get(`/orders/${id}`);
    setDetail(data);
  };
  const changeStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      load();
      if (detail) openDetail(id);
    } catch (e) { alert(e.response?.data?.message || 'Could not update status'); }
  };
  const remove = async (id) => {
    if (confirm('Delete this order?')) { await api.delete(`/orders/${id}`); setDetail(null); load(); }
  };

  const pending   = rows.filter(r => r.status === 'Pending').length;
  const completed = rows.filter(r => r.status === 'Completed').length;
  const totalRev  = rows.filter(r => r.status === 'Completed').reduce((s, o) => s + Number(o.total_amount || 0), 0);

  return (
    <div>
      <PageHeader
        title="🛒 Order Management"
        subtitle="Street vendor orders and fulfilment tracking"
        actions={<button className="btn-primary" onClick={() => { setErr(''); setCreate(true); }}>+ New Order</button>}
      />

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Orders',   value: rows.length,  icon: '🛒', color: 'blue' },
          { label: 'Pending',        value: pending,       icon: '⏳', color: 'orange' },
          { label: 'Completed',      value: completed,     icon: '✅', color: 'green' },
          { label: 'Revenue (Completed)', value: money(totalRev), icon: '💰', color: 'gold' },
        ].map(c => (
          <div key={c.label} className="stat-card" style={{ flex: 1, padding: '18px 20px' }}>
            <div className={`stat-icon-wrap ${c.color}`} style={{ width: 40, height: 40, fontSize: 18 }}>{c.icon}</div>
            <div className="stat-value" style={{ fontSize: c.label.includes('Revenue') ? '18px' : '24px' }}>{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="pill-tabs">
        {[
          { val: '',           label: 'All' },
          { val: 'Pending',    label: '⏳ Pending' },
          { val: 'Processing', label: '⚙️ Processing' },
          { val: 'Completed',  label: '✅ Completed' },
          { val: 'Cancelled',  label: '✕ Cancelled' },
        ].map(t => (
          <button
            key={t.val}
            className={`pill-tab ${statusFilter === t.val ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.val)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Vendor</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(o => {
              const meta = statusMeta[o.status] || { cls: 'info', icon: '•' };
              return (
                <tr key={o.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', color: 'var(--forest)' }}>
                      #{String(o.id).padStart(4, '0')}
                    </span>
                  </td>
                  <td>
                    <div className="cell-primary">{o.vendor_name}</div>
                    <div className="cell-sub">{o.business_name}</div>
                  </td>
                  <td className="cell-muted">{String(o.order_date).slice(0, 10)}</td>
                  <td className="fw-700 color-forest">{money(o.total_amount)}</td>
                  <td>
                    <span className={`badge ${meta.cls}`}>{meta.icon} {o.status}</span>
                  </td>
                  <td>
                    <button
                      className="btn-ghost"
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                      onClick={() => openDetail(o.id)}
                    >
                      View →
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6}>
                <div className="table-empty">
                  <div className="table-empty-icon">🛒</div>
                  <div className="table-empty-msg">No orders found</div>
                  <div className="table-empty-sub">Click "+ New Order" to create your first order</div>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE ORDER MODAL */}
      {create && (
        <Modal
          title="🛒 Create New Order"
          onClose={() => setCreate(false)}
          footer={<><button className="btn-ghost" onClick={() => setCreate(false)}>Cancel</button><button className="btn-primary" onClick={submit}>🚀 Place Order</button></>}
        >
          {err && <div className="form-error">⚠️ {err}</div>}
          <label>Street Vendor
            <select value={vendorId} onChange={e => setVendorId(e.target.value)}>
              <option value="">Select vendor…</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name} — {v.business_name}</option>)}
            </select>
          </label>

          <div style={{ marginBottom: '8px', fontWeight: 700, fontSize: '13px', color: 'var(--text-sec)' }}>Order Items</div>
          <div style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 36px', gap: '8px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
              <span>Product</span><span>Qty</span><span></span>
            </div>
            {items.map((it, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 36px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <select
                  style={{ padding: '9px 12px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--border)', fontSize: '13px', outline: 'none' }}
                  value={it.product_id}
                  onChange={e => setLine(i, 'product_id', e.target.value)}
                >
                  <option value="">Select product…</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.fruit_name} — {p.box_size} ({money(p.selling_price)})</option>)}
                </select>
                <input
                  style={{ padding: '9px 10px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--border)', width: '100%', outline: 'none', fontSize: '13px' }}
                  type="number"
                  min="1"
                  value={it.quantity}
                  onChange={e => setLine(i, 'quantity', e.target.value)}
                />
                <button
                  className="btn-icon danger"
                  onClick={() => removeLine(i)}
                  disabled={items.length === 1}
                  style={{ opacity: items.length === 1 ? 0.3 : 1 }}
                >
                  🗑️
                </button>
              </div>
            ))}
            <button className="btn-ghost" style={{ marginTop: '6px', fontSize: '13px', padding: '8px 14px' }} onClick={addLine}>
              + Add item
            </button>
          </div>

          <div style={{ background: 'linear-gradient(135deg,var(--forest),var(--forest-light))', borderRadius: 'var(--r-md)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
            <div style={{ fontSize: '13px', opacity: 0.75 }}>Estimated Total</div>
            <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: '22px', fontWeight: 800, color: 'var(--gold-light)' }}>
              {money(estTotal)}
            </div>
          </div>
        </Modal>
      )}

      {/* ORDER DETAIL MODAL */}
      {detail && (
        <Modal
          title={`📦 Order #${String(detail.id).padStart(4,'0')}`}
          onClose={() => setDetail(null)}
          footer={
            isAdmin && (
              <button className="btn-danger" onClick={() => remove(detail.id)}>
                🗑️ Delete Order
              </button>
            )
          }
        >
          {/* Status stepper */}
          {detail.status !== 'Cancelled' && (
            <div className="status-steps" style={{ marginBottom: '16px' }}>
              {STEP_ORDER.map(step => {
                const stepIdx   = STEP_ORDER.indexOf(step);
                const currentIdx = STEP_ORDER.indexOf(detail.status);
                const cls = stepIdx < currentIdx ? 'done' : stepIdx === currentIdx ? 'active' : '';
                return (
                  <div key={step} className={`status-step ${cls}`} style={{ fontSize: '10px' }}>
                    {step.split(' ')[0]}
                  </div>
                );
              })}
            </div>
          )}

          {/* Order info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--bg)', borderRadius: 'var(--r-md)', padding: '16px', marginBottom: '16px' }}>
            {[
              { label: 'Vendor',   value: detail.vendor_name },
              { label: 'Business', value: detail.business_name },
              { label: 'Location', value: detail.location },
              { label: 'Date',     value: String(detail.order_date).slice(0,10) },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</div>
                <div style={{ fontWeight: 600, color: 'var(--forest)', marginTop: '2px' }}>{f.value || '—'}</div>
              </div>
            ))}
          </div>

          {/* Items table */}
          <table className="data-table" style={{ boxShadow: 'none', border: '1.5px solid var(--border-light)', marginBottom: '16px' }}>
            <thead>
              <tr>
                <th>Fruit</th>
                <th>Box</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {detail.items.map(it => (
                <tr key={it.id}>
                  <td>
                    <div className="fruit-cell">
                      <img src={fruitImg(it.fruit_name)} alt={it.fruit_name} className="fruit-cell-img-sm" onError={e => e.target.src='/images/orange.jpg'} />
                      <span style={{ fontWeight: 600 }}>{it.fruit_name}</span>
                    </div>
                  </td>
                  <td><span className="badge box">{it.box_size}</span></td>
                  <td>{it.quantity}</td>
                  <td>{money(it.unit_price)}</td>
                  <td className="fw-700">{money(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ background: 'linear-gradient(135deg,var(--forest),var(--forest-light))', borderRadius: 'var(--r-md)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', opacity: 0.75 }}>Order Total</div>
            <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: '22px', fontWeight: 800, color: 'var(--gold-light)' }}>
              {money(detail.total_amount)}
            </div>
          </div>

          <label>Update Order Status
            <select value={detail.status} onChange={e => changeStatus(detail.id, e.target.value)} style={{ borderColor: 'var(--forest)', fontWeight: 600 }}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            ⚠️ Completing an order reduces available stock. Cancelled orders do not affect stock.
          </p>
        </Modal>
      )}
    </div>
  );
}
