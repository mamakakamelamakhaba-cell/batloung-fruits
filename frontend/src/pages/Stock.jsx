import { useEffect, useState, Fragment } from 'react';
import api, { money } from '../api/client';
import { fruitImg } from '../api/fruitImg.js';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Stock() {
  const toast = useToast();
  const [stock, setStock]         = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [movements, setMovements] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts]   = useState([]);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState({ supplier_id: '', product_id: '', quantity: '', unit_cost: '', purchase_date: '' });
  const [err, setErr]             = useState('');
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'purchases' | 'ledger'
  const [expanded, setExpanded]   = useState({});       // { [fruitName]: true }
  const [adjust, setAdjust]       = useState(null);     // product being adjusted
  const [adjForm, setAdjForm]     = useState({ change_qty: '', note: '' });
  const [adjErr, setAdjErr]       = useState('');
  const toggle = (name) => setExpanded(s => ({ ...s, [name]: !s[name] }));

  const load = () => {
    api.get('/stock').then(r => setStock(r.data)).catch(() => {});
    api.get('/stock/purchases').then(r => setPurchases(r.data)).catch(() => {});
    api.get('/stock/movements').then(r => setMovements(r.data)).catch(() => {});
  };
  useEffect(() => {
    load();
    api.get('/suppliers').then(r => setSuppliers(r.data)).catch(() => {});
    api.get('/products').then(r => setProducts(r.data)).catch(() => {});
  }, []);

  const save = async () => {
    try {
      await api.post('/stock', form);
      toast('📦 Stock purchase recorded!', 'success');
      setModal(false);
      setForm({ supplier_id: '', product_id: '', quantity: '', unit_cost: '', purchase_date: '' });
      load();
    } catch (e) { setErr(e.response?.data?.message || 'Save failed'); }
  };

  const openAdjust = (s) => { setAdjust(s); setAdjForm({ change_qty: '', note: '' }); setAdjErr(''); };
  const saveAdjust = async () => {
    try {
      await api.post('/stock/adjust', { product_id: adjust.product_id, change_qty: Number(adjForm.change_qty), note: adjForm.note });
      toast('⚖️ Stock adjusted!', 'success');
      setAdjust(null);
      load();
    } catch (e) { setAdjErr(e.response?.data?.message || 'Adjustment failed'); }
  };

  const totalStock = stock.reduce((sum, s) => sum + Number(s.stock_quantity || 0), 0);
  const lowStock   = stock.filter(s => s.stock_quantity < 20);

  // Group stock lines by fruit so a fruit appears once; box-size varieties
  // are revealed on expand (no repeated fruit rows).
  const sizeOrder = { Small: 0, Medium: 1, Large: 2 };
  const stockGroups = Object.values(
    stock.reduce((acc, s) => {
      const key = s.fruit_name || '—';
      if (!acc[key]) acc[key] = { fruit_name: key, variants: [] };
      acc[key].variants.push(s);
      return acc;
    }, {})
  )
    .map(g => ({
      ...g,
      variants: [...g.variants].sort((a, b) => (sizeOrder[a.box_size] ?? 9) - (sizeOrder[b.box_size] ?? 9)),
      totalStock: g.variants.reduce((s, v) => s + Number(v.stock_quantity || 0), 0),
      lowCount: g.variants.filter(v => v.stock_quantity < 20).length,
    }))
    .sort((a, b) => a.fruit_name.localeCompare(b.fruit_name));

  const movementBadge = (t) => {
    const map = {
      purchase:   { cls: 'ok',     label: 'Purchase' },
      sale:       { cls: 'danger', label: 'Sale' },
      adjustment: { cls: 'box',    label: 'Adjustment' },
      initial:    { cls: 'off',    label: 'Initial' },
    };
    const m = map[t] || { cls: 'box', label: t };
    return <span className={`badge ${m.cls}`} style={{ fontSize: '11px' }}>{m.label}</span>;
  };

  return (
    <div>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0B2519 0%, #1d4b2f 50%, #3a8c55 100%)',
        borderRadius: '20px', padding: '36px 48px', marginBottom: '28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '24px', position: 'relative', overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(11,37,25,0.25)',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/images/warehouse_stock.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(248,152,32,0.2)', border: '1px solid rgba(248,152,32,0.35)',
            color: '#FBB040', fontSize: '11px', fontWeight: 700, letterSpacing: '1px',
            textTransform: 'uppercase', padding: '4px 12px', borderRadius: '20px', marginBottom: '12px',
          }}>
            Warehouse Inventory
          </div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '30px', fontWeight: 800,
            color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2, marginBottom: '8px' }}>
            Stock Management
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', maxWidth: '400px' }}>
            {totalStock.toLocaleString()} boxes available across {stock.length} product lines
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <button className="btn-primary" onClick={() => { setErr(''); setModal(true); }} style={{ padding: '12px 24px', fontSize: '14px' }}>
            + Record Incoming Stock
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Product Lines',   value: stock.length,      icon: '📦', color: 'blue' },
          { label: 'Total Boxes',     value: totalStock,        icon: '🗃️', color: 'green' },
          { label: 'Low Stock Items', value: lowStock.length,   icon: '⚠️', color: 'orange' },
          { label: 'Purchases Logged',value: purchases.length,  icon: '📋', color: 'purple' },
        ].map(c => (
          <div key={c.label} className="stat-card" style={{ flex: 1, padding: '18px 20px' }}>
            <div className={`stat-icon-wrap ${c.color}`} style={{ width: 40, height: 40, fontSize: 18 }}>{c.icon}</div>
            <div className="stat-value" style={{ fontSize: '24px' }}>{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div style={{
          background: 'var(--warn-bg)', border: '1.5px solid var(--gold)', borderRadius: 'var(--r-md)',
          padding: '14px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--warn-txt)', fontSize: '14px' }}>
              {lowStock.length} product{lowStock.length > 1 ? 's' : ''} running low on stock
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {lowStock.map(s => s.fruit_name).join(', ')} — less than 20 boxes remaining
            </div>
          </div>
          <button className="btn-primary" style={{ marginLeft: 'auto', fontSize: '13px', padding: '8px 16px' }}
            onClick={() => { setErr(''); setModal(true); }}>
            Restock Now
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="pill-tabs">
        <button className={`pill-tab ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>
          📦 Available Stock
        </button>
        <button className={`pill-tab ${activeTab === 'purchases' ? 'active' : ''}`} onClick={() => setActiveTab('purchases')}>
          📋 Purchase History
        </button>
        <button className={`pill-tab ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => setActiveTab('ledger')}>
          🧾 Movement Ledger
        </button>
      </div>

      {/* STOCK TABLE — grouped by fruit, expand to see box sizes */}
      {activeTab === 'stock' && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>Fruit</th>
                <th>Sizes</th>
                <th>Total Available</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stockGroups.map(g => {
                const open = !!expanded[g.fruit_name];
                const grpLow = g.totalStock < 20;
                return (
                  <Fragment key={g.fruit_name}>
                    <tr style={{ cursor: 'pointer' }} onClick={() => toggle(g.fruit_name)}>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{open ? '▾' : '▸'}</td>
                      <td>
                        <div className="fruit-cell">
                          <img src={fruitImg(g.fruit_name)} alt={g.fruit_name} className="fruit-cell-img" onError={e => e.target.src = '/images/orange.jpg'} />
                          <div className="fruit-cell-name">{g.fruit_name}</div>
                        </div>
                      </td>
                      <td><span className="badge box">{g.variants.length} sizes</span></td>
                      <td className={grpLow ? 'low-stock' : 'fw-700'}>
                        {g.totalStock} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '12px' }}>boxes</span>
                      </td>
                      <td>
                        {g.lowCount > 0
                          ? <span className="badge danger" style={{ fontSize: '11px' }}>⚠️ {g.lowCount} low</span>
                          : <span className="badge ok" style={{ fontSize: '11px' }}>Healthy</span>}
                      </td>
                    </tr>
                    {open && g.variants.map(s => {
                      const pct = Math.min(100, (s.stock_quantity / 200) * 100);
                      const isLow = s.stock_quantity < 20;
                      return (
                        <tr key={s.product_id} style={{ background: 'var(--bg-alt)' }}>
                          <td></td>
                          <td style={{ paddingLeft: 28 }}><span className="badge box">{s.box_size}</span></td>
                          <td className="fw-700 color-forest">{money(s.selling_price)}</td>
                          <td className={isLow ? 'low-stock' : 'fw-700'}>
                            {s.stock_quantity} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '12px' }}>boxes</span>
                            {isLow && <span className="badge danger" style={{ marginLeft: '6px', fontSize: '10px' }}>Low</span>}
                          </td>
                          <td style={{ width: '220px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ height: '8px', background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%', width: `${pct}%`, borderRadius: '10px',
                                    background: isLow ? 'linear-gradient(90deg,#ef4444,#f97316)' : 'linear-gradient(90deg,var(--leaf),var(--gold))',
                                    transition: 'width 600ms ease'
                                  }} />
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', textAlign: 'right' }}>{pct.toFixed(0)}%</div>
                              </div>
                              <button className="btn-ghost" style={{ padding: '6px 10px', fontSize: '12px', whiteSpace: 'nowrap' }}
                                onClick={(e) => { e.stopPropagation(); openAdjust(s); }}>
                                ⚖️ Adjust
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
              {stockGroups.length === 0 && (
                <tr><td colSpan={5}>
                  <div className="table-empty">
                    <div className="table-empty-icon">🗃️</div>
                    <div className="table-empty-msg">No stock recorded yet</div>
                    <div className="table-empty-sub">Record incoming stock to get started</div>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PURCHASES TABLE */}
      {activeTab === 'purchases' && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Supplier</th>
                <th>Fruit / Product</th>
                <th>Quantity</th>
                <th>Unit Cost</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id}>
                  <td className="cell-muted">{String(p.purchase_date).slice(0, 10)}</td>
                  <td className="cell-primary">{p.supplier_name}</td>
                  <td>
                    <div className="fruit-cell">
                      <img src={fruitImg(p.fruit_name)} alt={p.fruit_name} className="fruit-cell-img-sm" onError={e => e.target.src='/images/orange.jpg'} />
                      <span>{p.fruit_name}</span>
                    </div>
                  </td>
                  <td>{p.quantity} <span className="text-sm color-muted">boxes</span></td>
                  <td>{money(p.unit_cost)}</td>
                  <td className="fw-700 color-forest">{money(p.unit_cost * p.quantity)}</td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr><td colSpan={6}>
                  <div className="table-empty">
                    <div className="table-empty-icon">📋</div>
                    <div className="table-empty-msg">No purchases recorded yet</div>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MOVEMENT LEDGER — immutable audit trail; current stock = sum of all movements */}
      {activeTab === 'ledger' && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Fruit / Product</th>
                <th>Type</th>
                <th>Change</th>
                <th>Note</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {movements.map(m => (
                <tr key={m.id}>
                  <td className="cell-muted">{String(m.created_at).replace('T', ' ').slice(0, 16)}</td>
                  <td>
                    <div className="fruit-cell">
                      <img src={fruitImg(m.fruit_name)} alt={m.fruit_name} className="fruit-cell-img-sm" onError={e => e.target.src='/images/orange.jpg'} />
                      <span>{m.fruit_name} <span className="text-sm color-muted">· {m.box_size}</span></span>
                    </div>
                  </td>
                  <td>{movementBadge(m.movement_type)}</td>
                  <td className="fw-700" style={{ color: m.change_qty < 0 ? '#dc2626' : 'var(--forest)' }}>
                    {m.change_qty > 0 ? `+${m.change_qty}` : m.change_qty}
                  </td>
                  <td className="cell-muted">{m.note || '—'}</td>
                  <td className="cell-muted">{m.created_by_name || 'System'}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr><td colSpan={6}>
                  <div className="table-empty">
                    <div className="table-empty-icon">🧾</div>
                    <div className="table-empty-msg">No stock movements yet</div>
                    <div className="table-empty-sub">Purchases, sales and adjustments appear here</div>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal
          title="📦 Record Incoming Stock"
          onClose={() => setModal(false)}
          footer={<><button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="btn-primary" onClick={save}>💾 Save Record</button></>}
        >
          {err && <div className="form-error">⚠️ {err}</div>}
          <label>Supplier
            <select value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })}>
              <option value="">Select supplier…</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.province})</option>)}
            </select>
          </label>
          <label>Product (Fruit + Box Size)
            <select value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
              <option value="">Select product…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.fruit_name} — {p.box_size}</option>)}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label>Quantity (boxes)
              <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
            </label>
            <label>Unit Cost (M)
              <input type="number" step="0.01" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: e.target.value })} placeholder="0.00" />
            </label>
          </div>
          <label>Purchase Date
            <input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
          </label>
          {form.quantity && form.unit_cost && (
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-md)', padding: '12px 16px', textAlign: 'center', border: '1.5px solid var(--border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL COST</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--forest)', fontFamily: 'Outfit,sans-serif' }}>
                {money(Number(form.quantity) * Number(form.unit_cost))}
              </div>
            </div>
          )}
        </Modal>
      )}

      {adjust && (
        <Modal
          title="⚖️ Adjust Stock"
          onClose={() => setAdjust(null)}
          footer={<><button className="btn-ghost" onClick={() => setAdjust(null)}>Cancel</button><button className="btn-primary" onClick={saveAdjust}>💾 Record Adjustment</button></>}
        >
          {adjErr && <div className="form-error">⚠️ {adjErr}</div>}
          <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-md)', padding: '12px 16px', marginBottom: '14px', border: '1.5px solid var(--border)' }}>
            <div style={{ fontWeight: 700 }}>{adjust.fruit_name} — {adjust.box_size}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current available: <strong>{adjust.stock_quantity}</strong> boxes</div>
          </div>
          <label>Change (boxes) — use a negative number to reduce
            <input type="number" value={adjForm.change_qty} onChange={e => setAdjForm({ ...adjForm, change_qty: e.target.value })} placeholder="e.g. 5 or -3" />
          </label>
          <label>Reason / Note
            <input type="text" value={adjForm.note} onChange={e => setAdjForm({ ...adjForm, note: e.target.value })} placeholder="e.g. Spoilage write-off, stock count correction" />
          </label>
          {adjForm.change_qty !== '' && !isNaN(Number(adjForm.change_qty)) && (
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-md)', padding: '12px 16px', textAlign: 'center', border: '1.5px solid var(--border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>NEW AVAILABLE</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--forest)', fontFamily: 'Outfit,sans-serif' }}>
                {Number(adjust.stock_quantity) + Number(adjForm.change_qty)} boxes
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
