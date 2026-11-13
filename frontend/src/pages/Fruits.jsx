import { useEffect, useState } from 'react';
import api from '../api/client';
import { fruitImg } from '../api/fruitImg.js';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';

const blank = { name: '', description: '', is_active: 1 };

export default function Fruits() {
  const [rows, setRows]     = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState(blank);
  const [err, setErr]       = useState('');
  const [view, setView]     = useState('table'); // 'table' | 'cards'

  const load = () => api.get('/fruits', { params: { search } }).then(r => setRows(r.data)).catch(() => {});
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [search]);

  const openAdd  = () => { setForm(blank); setErr(''); setModal({ mode: 'add' }); };
  const openEdit = (f) => { setForm(f); setErr(''); setModal({ mode: 'edit', id: f.id }); };

  const save = async () => {
    try {
      if (modal.mode === 'add') await api.post('/fruits', form);
      else await api.put(`/fruits/${modal.id}`, form);
      setModal(null); load();
    } catch (e) { setErr(e.response?.data?.message || 'Save failed'); }
  };
  const remove = async (id) => {
    if (!confirm('Delete this fruit? Related products will also be removed.')) return;
    await api.delete(`/fruits/${id}`); load();
  };

  const active   = rows.filter(r => r.is_active);
  const inactive = rows.filter(r => !r.is_active);

  return (
    <div>
      <PageHeader
        title="Fruit Catalogue"
        subtitle="Manage the fruits Batloung Fruits sources and sells across Lesotho"
        actions={<button className="btn-primary" onClick={openAdd}>+ Add Fruit</button>}
      />

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Fruits',  value: rows.length,    icon: '🍓', color: 'green',  sub: 'In catalogue' },
          { label: 'Active',        value: active.length,  icon: '✅', color: 'green',  sub: 'Available for sale' },
          { label: 'Inactive',      value: inactive.length,icon: '⏸️', color: 'orange', sub: 'Temporarily paused' },
        ].map(c => (
          <div key={c.label} className="stat-card" style={{ flex: 1, padding: '22px 24px' }}>
            <div className={`stat-icon-wrap ${c.color}`} style={{ width: 44, height: 44, fontSize: 20 }}>{c.icon}</div>
            <div className="stat-value" style={{ fontSize: '28px', marginTop: '10px' }}>{c.value}</div>
            <div className="stat-label">{c.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="tb-search" style={{ position: 'relative' }}>
          <span className="tb-search-icon">🔍</span>
          <input
            className="search"
            style={{ paddingLeft: '38px' }}
            placeholder="Search fruits…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button className={`btn-ghost ${view === 'table' ? 'active-view' : ''}`} onClick={() => setView('table')}
            style={{ padding: '9px 14px', ...(view==='table' ? {background:'var(--forest)',color:'#fff',borderColor:'var(--forest)'} : {}) }}>
            ☰ Table
          </button>
          <button className="btn-ghost" onClick={() => setView('cards')}
            style={{ padding: '9px 14px', ...(view==='cards' ? {background:'var(--forest)',color:'#fff',borderColor:'var(--forest)'} : {}) }}>
            ⊞ Cards
          </button>
        </div>
      </div>

      {/* CARD VIEW */}
      {view === 'cards' && (
        <div className="product-cards">
          {rows.map(f => (
            <div key={f.id} className="product-card">
              <img
                src={fruitImg(f.name)}
                alt={f.name}
                className="product-card-img"
                style={{ height: '160px', objectFit: 'cover' }}
                onError={e => e.target.src = '/images/strawberry.jpg'}
              />
              <div className="product-card-body">
                <div className="product-card-name">{f.name}</div>
                <div className="product-card-sub">{f.description || 'No description'}</div>
                <div className="product-card-footer">
                  <span className={`badge ${f.is_active ? 'ok' : 'off'}`}>
                    {f.is_active ? '● Active' : '○ Inactive'}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn-icon" onClick={() => openEdit(f)} title="Edit">✏️</button>
                    <button className="btn-icon danger" onClick={() => remove(f.id)} title="Delete">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="table-empty" style={{ gridColumn: '1/-1' }}>
              <div className="table-empty-icon">🍑</div>
              <div className="table-empty-msg">No fruits found</div>
            </div>
          )}
        </div>
      )}

      {/* TABLE VIEW */}
      {view === 'table' && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fruit</th>
                <th>Description</th>
                <th>Status</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(f => (
                <tr key={f.id}>
                  <td>
                    <div className="fruit-cell">
                      <img
                        src={fruitImg(f.name)}
                        alt={f.name}
                        className="fruit-cell-img"
                        onError={e => e.target.src = '/images/orange.jpg'}
                      />
                      <div>
                        <div className="fruit-cell-name">{f.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="cell-muted">{f.description || '—'}</td>
                  <td><span className={`badge ${f.is_active ? 'ok' : 'off'}`}>{f.is_active ? '● Active' : '○ Inactive'}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn-icon" onClick={() => openEdit(f)} title="Edit">✏️</button>
                      <button className="btn-icon danger" onClick={() => remove(f.id)} title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={4}>
                  <div className="table-empty">
                    <div className="table-empty-icon">🍑</div>
                    <div className="table-empty-msg">No fruits found</div>
                    <div className="table-empty-sub">Click "+ Add Fruit" to get started</div>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal
          title={modal.mode === 'add' ? 'Add New Fruit' : 'Edit Fruit'}
          onClose={() => setModal(null)}
          footer={<><button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn-primary" onClick={save}>Save Fruit</button></>}
        >
          {err && <div className="form-error">⚠️ {err}</div>}
          <label>
            Fruit Name
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mango" />
          </label>
          <label>
            Description
            <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description of this fruit..." />
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={!!form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} />
            <span>Active — visible in products & orders</span>
          </label>
        </Modal>
      )}
    </div>
  );
}
