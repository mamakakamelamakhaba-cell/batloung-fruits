import { useEffect, useState } from 'react';
import api from '../api/client';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';

const PROVINCES = [
  'Eastern Cape','Free State','Gauteng','KwaZulu-Natal',
  'Limpopo','Mpumalanga','Northern Cape','North West','Western Cape'
];
const blank = { name: '', province: '', contact_person: '', telephone: '', email: '', address: '' };

const PROVINCE_EMOJI = {
  'Eastern Cape': '🌊', 'Free State': '🌾', 'Gauteng': '🏙️',
  'KwaZulu-Natal': '🦁', 'Limpopo': '🐘', 'Mpumalanga': '🌅',
  'Northern Cape': '🏜️', 'North West': '💎', 'Western Cape': '🍇'
};

// Build a Google Maps search link from a supplier's address + province.
const mapsUrl = (s) => {
  const q = [s.name, s.address, s.province, 'South Africa'].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
};

export default function Suppliers() {
  const [rows, setRows]       = useState([]);
  const [search, setSearch]   = useState('');
  const [province, setProvince] = useState('');
  const [modal, setModal]     = useState(null);
  const [detail, setDetail]   = useState(null);
  const [form, setForm]       = useState(blank);
  const [err, setErr]         = useState('');

  const load = () => api.get('/suppliers', { params: { search, province } }).then(r => setRows(r.data)).catch(() => {});
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [search, province]);

  const openAdd  = () => { setForm(blank); setErr(''); setModal({ mode: 'add' }); };
  const openEdit = (s) => { setForm(s); setErr(''); setModal({ mode: 'edit', id: s.id }); };
  const save = async () => {
    try {
      if (modal.mode === 'add') await api.post('/suppliers', form);
      else await api.put(`/suppliers/${modal.id}`, form);
      setModal(null); load();
    } catch (e) { setErr(e.response?.data?.message || 'Save failed'); }
  };
  const remove = async (id) => {
    if (confirm('Delete this supplier?')) { await api.delete(`/suppliers/${id}`); load(); }
  };

  const byProvince = PROVINCES.map(p => ({ province: p, count: rows.filter(r => r.province === p).length })).filter(p => p.count > 0);

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
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/images/suppliers_truck.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(248,152,32,0.2)', border: '1px solid rgba(248,152,32,0.35)',
            color: '#FBB040', fontSize: '11px', fontWeight: 700, letterSpacing: '1px',
            textTransform: 'uppercase', padding: '4px 12px', borderRadius: '20px', marginBottom: '12px',
          }}>
            SA Province Network
          </div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '30px', fontWeight: 800,
            color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2, marginBottom: '8px' }}>
            Supplier Management
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', maxWidth: '400px' }}>
            Fruit suppliers sourced from {rows.length} companies across all 9 South African provinces
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <button className="btn-primary" onClick={openAdd} style={{ padding: '12px 24px', fontSize: '14px' }}>
            + Add Supplier
          </button>
        </div>
      </div>

      {/* Province coverage cards */}
      {byProvince.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {byProvince.map(p => (
            <div key={p.province} style={{
              background: province === p.province ? 'var(--forest)' : '#fff',
              color: province === p.province ? '#fff' : 'var(--text)',
              border: '1.5px solid', borderColor: province === p.province ? 'var(--forest)' : 'var(--border)',
              borderRadius: 'var(--r-md)',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 150ms',
              display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: province === p.province ? 'var(--sh-sm)' : 'none',
            }}
            onClick={() => setProvince(province === p.province ? '' : p.province)}>
              <span>{PROVINCE_EMOJI[p.province] || '📍'}</span>
              {p.province}
              <span style={{
                background: province === p.province ? 'rgba(255,255,255,0.2)' : 'var(--bg)',
                borderRadius: '12px', padding: '1px 8px', fontSize: '11px'
              }}>{p.count}</span>
            </div>
          ))}
          {province && (
            <button className="btn-ghost" style={{ padding: '8px 14px', fontSize: '13px' }} onClick={() => setProvince('')}>
              ✕ Clear
            </button>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }}>🔍</span>
          <input className="search" style={{ paddingLeft: '36px' }} placeholder="Search suppliers…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={province} onChange={e => setProvince(e.target.value)}>
          <option value="">All provinces</option>
          {PROVINCES.map(p => <option key={p}>{p}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500 }}>
          {rows.length} supplier{rows.length !== 1 ? 's' : ''} found
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Supplier</th>
              <th>Province</th>
              <th>Contact Person</th>
              <th>Telephone</th>
              <th>Email</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => (
              <tr key={s.id}>
                <td className="cell-muted text-sm">{i + 1}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '10px',
                      background: 'linear-gradient(135deg, var(--forest) 0%, var(--forest-light) 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px', flexShrink: 0, color: '#fff'
                    }}>
                      {PROVINCE_EMOJI[s.province] || '🚚'}
                    </div>
                    <div>
                      <div className="cell-primary">{s.name}</div>
                      <div className="cell-sub">{s.address || 'No address listed'}</div>
                      <a
                        href={mapsUrl(s)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--forest)', textDecoration: 'none', marginTop: '2px' }}
                        onClick={e => e.stopPropagation()}
                      >
                        📍 View on map
                      </a>
                    </div>
                  </div>
                </td>
                <td><span className="badge prov">{PROVINCE_EMOJI[s.province]} {s.province}</span></td>
                <td>{s.contact_person || '—'}</td>
                <td className="cell-muted">{s.telephone || '—'}</td>
                <td className="cell-muted" style={{ fontSize: '13px' }}>{s.email || '—'}</td>
                <td>
                  <div className="row-actions">
                    <a className="btn-icon" href={mapsUrl(s)} target="_blank" rel="noopener noreferrer" title="View on Google Maps" onClick={e => e.stopPropagation()}>🗺️</a>
                    <button className="btn-icon" onClick={() => openEdit(s)}>✏️</button>
                    <button className="btn-icon danger" onClick={() => remove(s.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7}>
                <div className="table-empty">
                  <div className="table-empty-icon">🚚</div>
                  <div className="table-empty-msg">No suppliers found</div>
                  <div className="table-empty-sub">Add suppliers to manage your produce sourcing</div>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          title={modal.mode === 'add' ? '🚚 Add New Supplier' : '✏️ Edit Supplier'}
          onClose={() => setModal(null)}
          footer={<><button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn-primary" onClick={save}>💾 Save Supplier</button></>}
        >
          {err && <div className="form-error">⚠️ {err}</div>}
          <label>Company Name
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cape Farms Ltd." />
          </label>
          <label>Province
            <select value={form.province} onChange={e => setForm({ ...form, province: e.target.value })}>
              <option value="">Select province…</option>
              {PROVINCES.map(p => <option key={p}>{PROVINCE_EMOJI[p]} {p}</option>)}
            </select>
          </label>
          <label>Contact Person
            <input value={form.contact_person || ''} onChange={e => setForm({ ...form, contact_person: e.target.value })} placeholder="Full name" />
          </label>
          <label>Telephone
            <input value={form.telephone || ''} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="+27 xx xxx xxxx" />
          </label>
          <label>Email
            <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contact@supplier.co.za" />
          </label>
          <label>Physical Address
            <textarea value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Street, City, Postal Code" />
          </label>
        </Modal>
      )}
    </div>
  );
}
