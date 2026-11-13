import { useEffect, useState, Fragment } from 'react';
import api, { money } from '../api/client';
import { fruitImg } from '../api/fruitImg.js';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Products() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const [rows, setRows]         = useState([]);
  const [fruits, setFruits]     = useState([]);
  const [boxes, setBoxes]       = useState([]);
  const [search, setSearch]     = useState('');
  const [boxFilter, setBoxFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState({});
  const [err, setErr]           = useState('');
  const [view, setView]         = useState('cards'); // 'cards' | 'table'
  const [expanded, setExpanded] = useState({});       // { [fruitName]: true }
  const toggle = (name) => setExpanded(s => ({ ...s, [name]: !s[name] }));

  const load = () => api.get('/products', { params: { search, box_size_id: boxFilter } }).then(r => setRows(r.data)).catch(() => {});
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [search, boxFilter]);
  useEffect(() => {
    api.get('/fruits', { params: { active: 'true' } }).then(r => setFruits(r.data)).catch(() => {});
    api.get('/boxsizes').then(r => setBoxes(r.data)).catch(() => {});
  }, []);

  const openAdd  = () => { setForm({ fruit_id: '', box_size_id: '', selling_price: '', stock_quantity: 0, is_active: 1 }); setErr(''); setModal({ mode: 'add' }); };
  const openEdit = (p) => { setForm(p); setErr(''); setModal({ mode: 'edit', id: p.id }); };

  const save = async () => {
    try {
      if (modal.mode === 'add') await api.post('/products', form);
      else await api.put(`/products/${modal.id}`, form);
      toast(modal.mode === 'add' ? '📦 Product added!' : '✏️ Product updated!', 'success');
      setModal(null); load();
    } catch (e) { setErr(e.response?.data?.message || 'Save failed'); }
  };
  const remove = async (id) => {
    if (confirm('Delete this product configuration?')) { await api.delete(`/products/${id}`); toast('🗑️ Product deleted.', 'success'); load(); }
  };

  const filtered = rows.filter(r => {
    if (statusFilter === 'active')   return r.is_active;
    if (statusFilter === 'inactive') return !r.is_active;
    if (statusFilter === 'low')      return r.stock_quantity < 20;
    return true;
  });

  // Group variants by fruit so a fruit is shown once; its box-size varieties
  // are revealed on expand (no repeated fruit rows/cards).
  const sizeOrder = { Small: 0, Medium: 1, Large: 2 };
  const groups = Object.values(
    filtered.reduce((acc, p) => {
      const key = p.fruit_name || '—';
      if (!acc[key]) acc[key] = { fruit_name: key, variants: [] };
      acc[key].variants.push(p);
      return acc;
    }, {})
  )
    .map(g => {
      const variants = [...g.variants].sort(
        (a, b) => (sizeOrder[a.box_size] ?? 9) - (sizeOrder[b.box_size] ?? 9)
      );
      const prices = variants.map(v => Number(v.selling_price)).filter(n => !isNaN(n));
      return {
        fruit_name: g.fruit_name,
        variants,
        totalStock: variants.reduce((s, v) => s + Number(v.stock_quantity || 0), 0),
        activeCount: variants.filter(v => v.is_active).length,
        minPrice: prices.length ? Math.min(...prices) : 0,
        maxPrice: prices.length ? Math.max(...prices) : 0,
      };
    })
    .sort((a, b) => a.fruit_name.localeCompare(b.fruit_name));

  return (
    <div>
      <PageHeader
        title="Products Catalogue"
        subtitle="Fruit &amp; box-size configurations with Maloti pricing"
        actions={isAdmin && <button className="btn-primary" onClick={openAdd}>+ Add Product</button>}
      />

      {/* Quick stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Products',    value: rows.length,                           icon: '📦', color: 'blue' },
          { label: 'Active Products',   value: rows.filter(r=>r.is_active).length,    icon: '✅', color: 'green' },
          { label: 'Low Stock (< 20)',  value: rows.filter(r=>r.stock_quantity<20).length, icon: '⚠️', color: 'orange' },
          { label: 'Box Sizes',         value: boxes.length,                          icon: '🗃️', color: 'purple' },
        ].map(c => (
          <div key={c.label} className="stat-card" style={{ flex: 1, padding: '18px 20px' }}>
            <div className={`stat-icon-wrap ${c.color}`} style={{ width: 40, height: 40, fontSize: 18 }}>{c.icon}</div>
            <div className="stat-value" style={{ fontSize: '24px' }}>{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }}>🔍</span>
          <input className="search" style={{ paddingLeft: '36px' }} placeholder="Search by fruit…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={boxFilter} onChange={e => setBoxFilter(e.target.value)}>
          <option value="">All box sizes</option>
          {boxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
          <option value="low">Low stock</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button className="btn-ghost" onClick={() => setView('cards')}
            style={{ padding: '9px 14px', ...(view==='cards' ? {background:'var(--forest)',color:'#fff',borderColor:'var(--forest)'} : {}) }}>
            ⊞ Cards
          </button>
          <button className="btn-ghost" onClick={() => setView('table')}
            style={{ padding: '9px 14px', ...(view==='table' ? {background:'var(--forest)',color:'#fff',borderColor:'var(--forest)'} : {}) }}>
            ☰ Table
          </button>
        </div>
      </div>

      {/* CARDS VIEW — one card per fruit, expand to see box-size varieties */}
      {view === 'cards' && (
        <div className="product-cards">
          {groups.map(g => {
            const open = !!expanded[g.fruit_name];
            return (
              <div key={g.fruit_name} className="product-card">
                <img
                  src={fruitImg(g.fruit_name)}
                  alt={g.fruit_name}
                  className="product-card-img"
                  style={{ height: '160px', objectFit: 'cover', objectPosition: 'center', cursor: 'pointer' }}
                  onClick={() => toggle(g.fruit_name)}
                  onError={e => e.target.src = '/images/strawberry.jpg'}
                />
                <div className="product-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="product-card-name">{g.fruit_name}</div>
                    <span className="badge box" style={{ fontSize: '11px' }}>{g.variants.length} sizes</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 10px' }}>
                    <div className="product-price">
                      {g.minPrice === g.maxPrice ? money(g.minPrice) : `${money(g.minPrice)} – ${money(g.maxPrice)}`}
                    </div>
                    <span className={g.totalStock < 20 ? 'badge danger' : 'badge ok'} style={{ fontSize: '11px' }}>
                      {g.totalStock < 20 ? '⚠️ ' : ''}{g.totalStock} boxes
                    </span>
                  </div>
                  <button
                    className="btn-ghost"
                    onClick={() => toggle(g.fruit_name)}
                    style={{ width: '100%', padding: '8px', fontSize: '13px' }}
                  >
                    {open ? '▲ Hide sizes' : `▼ View ${g.variants.length} size${g.variants.length > 1 ? 's' : ''}`}
                  </button>

                  {open && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {g.variants.map(p => (
                        <div key={p.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          gap: '8px', padding: '8px 10px', background: 'var(--bg-alt)', borderRadius: '8px'
                        }}>
                          <span className="badge box" style={{ fontSize: '11px' }}>{p.box_size}</span>
                          <span className="fw-700 color-forest">{money(p.selling_price)}</span>
                          <span className={p.stock_quantity < 20 ? 'badge danger' : 'badge ok'} style={{ fontSize: '11px' }}>
                            {p.stock_quantity} boxes
                          </span>
                          <span className={`badge ${p.is_active ? 'ok' : 'off'}`} style={{ fontSize: '11px' }}>{p.is_active ? '●' : '○'}</span>
                          {isAdmin && (
                            <span style={{ display: 'flex', gap: '4px' }}>
                              <button className="btn-icon" onClick={() => openEdit(p)}>✏️</button>
                              <button className="btn-icon danger" onClick={() => remove(p.id)}>🗑️</button>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {groups.length === 0 && (
            <div className="table-empty" style={{ gridColumn: '1/-1' }}>
              <div className="table-empty-icon">📦</div>
              <div className="table-empty-msg">No products found</div>
            </div>
          )}
        </div>
      )}

      {/* TABLE VIEW — one row per fruit, expand to see box-size varieties */}
      {view === 'table' && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>Fruit</th>
                <th>Sizes</th>
                <th>Price Range</th>
                <th>Total Stock</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(g => {
                const open = !!expanded[g.fruit_name];
                return (
                  <Fragment key={g.fruit_name}>
                    <tr style={{ cursor: 'pointer' }} onClick={() => toggle(g.fruit_name)}>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{open ? '▾' : '▸'}</td>
                      <td>
                        <div className="fruit-cell">
                          <img src={fruitImg(g.fruit_name)} alt={g.fruit_name} className="fruit-cell-img" onError={e => e.target.src='/images/strawberry.jpg'} />
                          <span className="cell-primary">{g.fruit_name}</span>
                        </div>
                      </td>
                      <td><span className="badge box">{g.variants.length} sizes</span></td>
                      <td className="fw-700 color-forest">
                        {g.minPrice === g.maxPrice ? money(g.minPrice) : `${money(g.minPrice)} – ${money(g.maxPrice)}`}
                      </td>
                      <td className={g.totalStock < 20 ? 'low-stock' : ''}>
                        {g.totalStock} <span className="text-sm color-muted">boxes</span>
                      </td>
                      <td>{g.activeCount}/{g.variants.length}</td>
                    </tr>
                    {open && g.variants.map(p => (
                      <tr key={p.id} style={{ background: 'var(--bg-alt)' }}>
                        <td></td>
                        <td style={{ paddingLeft: 28, color: 'var(--text-muted)' }}>↳ {g.fruit_name}</td>
                        <td><span className="badge box">{p.box_size}</span></td>
                        <td className="fw-700 color-forest">{money(p.selling_price)}</td>
                        <td className={p.stock_quantity < 20 ? 'low-stock' : ''}>
                          {p.stock_quantity} <span className="text-sm color-muted">boxes</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`badge ${p.is_active ? 'ok' : 'off'}`}>{p.is_active ? '● Active' : '○ Inactive'}</span>
                            {isAdmin && (
                              <span className="row-actions">
                                <button className="btn-icon" onClick={() => openEdit(p)}>✏️</button>
                                <button className="btn-icon danger" onClick={() => remove(p.id)}>🗑️</button>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
              {groups.length === 0 && (
                <tr><td colSpan={6}>
                  <div className="table-empty">
                    <div className="table-empty-icon">📦</div>
                    <div className="table-empty-msg">No products found</div>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal
          title={modal.mode === 'add' ? '📦 Add Product' : '✏️ Edit Product'}
          onClose={() => setModal(null)}
          footer={<><button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn-primary" onClick={save}>💾 Save</button></>}
        >
          {err && <div className="form-error">⚠️ {err}</div>}
          {modal.mode === 'add' && (
            <>
              <label>Fruit
                <select value={form.fruit_id} onChange={e => setForm({ ...form, fruit_id: e.target.value })}>
                  <option value="">Select fruit…</option>
                  {fruits.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </label>
              <label>Box Size
                <select value={form.box_size_id} onChange={e => setForm({ ...form, box_size_id: e.target.value })}>
                  <option value="">Select box size…</option>
                  {boxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
            </>
          )}
          <label>Selling Price (Maloti — M)
            <input type="number" step="0.01" value={form.selling_price} onChange={e => setForm({ ...form, selling_price: e.target.value })} placeholder="0.00" />
          </label>
          <label>Stock Quantity (boxes)
            <input type="number" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} />
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={!!form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} />
            <span>Active — available for ordering</span>
          </label>
        </Modal>
      )}
    </div>
  );
}
