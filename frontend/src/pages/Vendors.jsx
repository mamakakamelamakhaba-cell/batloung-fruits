import { useEffect, useState } from 'react';
import api from '../api/client';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

const blank = { name: '', business_name: '', telephone: '', location: '', status: 'Active' };

const LOCATIONS = [
  'Maseru CBD', 'Thamae', 'Hoohlo', 'Khubetsoana', 'Thetsane',
  'Ha Thetsane', 'Maseru West', 'Maseru East', 'Lepereng',
  'Qoaling', 'Ha Abia', 'Pitso Ground', 'Lancer\'s Gap', 'Maqalika',
  "Ts'osane", 'Ha Foso', 'Sica', 'Sekamaneng',
];

// Generate a professional vendor photo using DiceBear (human faces) as avatars
const vendorPhoto = (name, id) => {
  // Use a professional human avatar service
  const seed = encodeURIComponent(name || 'vendor');
  return `https://api.dicebear.com/7.x/personas/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
};

// Color accent per vendor (based on name hash)
const vendorAccent = (name) => {
  const palettes = [
    { bg: 'linear-gradient(135deg,#0B2519,#1d4b2f)', text: '#F89820' },
    { bg: 'linear-gradient(135deg,#1e3a5f,#2563eb)', text: '#60a5fa' },
    { bg: 'linear-gradient(135deg,#4c1d95,#6d28d9)', text: '#c4b5fd' },
    { bg: 'linear-gradient(135deg,#7c2d12,#c2410c)', text: '#fdba74' },
    { bg: 'linear-gradient(135deg,#064e3b,#059669)', text: '#6ee7b7' },
    { bg: 'linear-gradient(135deg,#1e1b4b,#4338ca)', text: '#a5b4fc' },
    { bg: 'linear-gradient(135deg,#701a75,#a21caf)', text: '#f0abfc' },
  ];
  const idx = (name?.charCodeAt(0) || 0) % palettes.length;
  return palettes[idx];
};

const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

export default function Vendors() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const [rows, setRows]         = useState([]);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState(blank);
  const [err, setErr]           = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  const load = () => api.get('/vendors', { params: { search, status } }).then(r => setRows(r.data)).catch(() => {});
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [search, status]);

  const openAdd  = () => { setForm(blank); setErr(''); setModal({ mode: 'add' }); };
  const openEdit = (v) => { setForm(v); setErr(''); setModal({ mode: 'edit', id: v.id }); };

  const save = async () => {
    try {
      if (modal.mode === 'add') await api.post('/vendors', form);
      else await api.put(`/vendors/${modal.id}`, form);
      toast(modal.mode === 'add' ? '🏪 Vendor registered!' : '✏️ Vendor updated!', 'success');
      setModal(null); load();
    } catch (e) { setErr(e.response?.data?.message || 'Save failed'); }
  };
  const remove = async (id) => {
    if (confirm('Delete this vendor?')) { await api.delete(`/vendors/${id}`); load(); }
  };

  const active   = rows.filter(r => r.status === 'Active');
  const inactive = rows.filter(r => r.status !== 'Active');

  return (
    <div>
      {/* Hero Banner */}
      <div className="page-hero-banner" style={{
        background: 'linear-gradient(135deg, #0B2519 0%, #1d4b2f 50%, #3a8c55 100%)',
        borderRadius: '20px',
        padding: '36px 48px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(11,37,25,0.25)',
      }}>
        {/* Background image overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/vendor_portrait.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center right',
          opacity: 0.12,
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(248,152,32,0.2)', border: '1px solid rgba(248,152,32,0.35)',
            color: '#FBB040', fontSize: '11px', fontWeight: 700,
            letterSpacing: '1px', textTransform: 'uppercase',
            padding: '4px 12px', borderRadius: '20px', marginBottom: '12px',
          }}>
            🏪 Street Vendor Network
          </div>
          <h1 style={{
            fontFamily: "'Outfit', sans-serif", fontSize: '30px', fontWeight: 800,
            color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2, marginBottom: '8px',
          }}>
            Vendor Management
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', maxWidth: '400px' }}>
            Managing {rows.length} street vendors operating across Maseru, Lesotho
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '12px' }}>
          {isAdmin && (
            <button className="btn-primary" onClick={openAdd} style={{ padding: '12px 24px', fontSize: '14px' }}>
              + Register Vendor
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Vendors',  value: rows.length,    icon: '🏪', color: 'blue',   sub: 'Registered network' },
          { label: 'Active Vendors', value: active.length,  icon: '✅', color: 'green',  sub: 'Currently operating' },
          { label: 'Inactive',       value: inactive.length,icon: '⏸️', color: 'orange', sub: 'Temporarily paused' },
        ].map(c => (
          <div key={c.label} className="stat-card" style={{ padding: '22px 24px' }}>
            <div className={`stat-icon-wrap ${c.color}`} style={{ width: 44, height: 44, fontSize: 20 }}>{c.icon}</div>
            <div className="stat-value" style={{ fontSize: '28px', marginTop: '10px' }}>{c.value}</div>
            <div className="stat-label" style={{ fontSize: '13px' }}>{c.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }}>🔍</span>
          <input className="search" style={{ paddingLeft: '36px' }} placeholder="Search vendors…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="Active">Active only</option>
          <option value="Inactive">Inactive only</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button className="btn-ghost" onClick={() => setViewMode('cards')}
            style={{ padding: '9px 14px', ...(viewMode==='cards' ? {background:'var(--forest)',color:'#fff',borderColor:'var(--forest)'} : {}) }}>
            ⊞ Cards
          </button>
          <button className="btn-ghost" onClick={() => setViewMode('table')}
            style={{ padding: '9px 14px', ...(viewMode==='table' ? {background:'var(--forest)',color:'#fff',borderColor:'var(--forest)'} : {}) }}>
            ☰ Table
          </button>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, paddingLeft: '8px' }}>
            {rows.length} vendor{rows.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* CARD VIEW */}
      {viewMode === 'cards' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '20px',
          marginBottom: '24px',
        }}>
          {rows.map(v => {
            const accent = vendorAccent(v.name);
            const inits = initials(v.name);
            return (
              <div key={v.id} style={{
                background: '#fff',
                borderRadius: '16px',
                border: '1.5px solid var(--border-light)',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(11,37,25,0.08)',
                transition: 'all 250ms cubic-bezier(0.4,0,0.2,1)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(11,37,25,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(11,37,25,0.08)'; }}
              >
                {/* Card header with gradient + avatar */}
                <div style={{
                  background: accent.bg,
                  height: '80px',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '0 20px',
                }}>
                  {/* Status badge top right */}
                  <span style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: v.status === 'Active' ? 'rgba(16,185,129,0.2)' : 'rgba(156,163,175,0.2)',
                    color: v.status === 'Active' ? '#6ee7b7' : '#d1d5db',
                    border: `1px solid ${v.status === 'Active' ? 'rgba(16,185,129,0.4)' : 'rgba(156,163,175,0.3)'}`,
                    fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                    letterSpacing: '0.5px',
                  }}>
                    {v.status === 'Active' ? '● Active' : '○ Inactive'}
                  </span>
                  {/* Avatar overlapping */}
                  <div style={{
                    width: '64px', height: '64px',
                    borderRadius: '50%',
                    border: '3px solid #fff',
                    background: accent.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: accent.text,
                    fontSize: '22px', fontWeight: 800,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                    transform: 'translateY(32px)',
                    flexShrink: 0,
                    overflow: 'hidden',
                    zIndex: 1,
                  }}>
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(v.name)}&background=${accent.bg.includes('0B2519') ? '0B2519' : accent.bg.includes('1e3a5f') ? '1e3a5f' : '4c1d95'}&color=fff&size=64&bold=true&format=png`}
                      alt={v.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML = `<span style="font-size:22px;font-weight:800;color:${accent.text}">${inits}</span>`; }}
                    />
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: '44px 20px 20px' }}>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--forest)', marginBottom: '2px' }}>
                    {v.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', fontWeight: 500 }}>
                    {v.business_name || 'Independent Vendor'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-sec)' }}>
                      <span style={{ fontSize: '14px' }}>📍</span>
                      <span>{v.location || 'Maseru'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-sec)' }}>
                      <span style={{ fontSize: '14px' }}>📞</span>
                      <span>{v.telephone || 'No phone listed'}</span>
                    </div>
                    {v.registration_date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-sec)' }}>
                        <span style={{ fontSize: '14px' }}>📅</span>
                        <span>Since {String(v.registration_date).slice(0,10)}</span>
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                      <button className="btn-ghost" onClick={() => openEdit(v)} style={{ flex: 1, padding: '8px', fontSize: '12px', justifyContent: 'center' }}>
                        ✏️ Edit
                      </button>
                      <button className="btn-icon danger" onClick={() => remove(v.id)} title="Delete" style={{ width: '36px', height: '36px' }}>🗑️</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {rows.length === 0 && (
            <div className="table-empty" style={{ gridColumn: '1/-1' }}>
              <div className="table-empty-icon">🏪</div>
              <div className="table-empty-msg">No vendors registered yet</div>
              <div className="table-empty-sub">Click "+ Register Vendor" to add your first vendor</div>
            </div>
          )}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Business Name</th>
                <th>Location</th>
                <th>Telephone</th>
                <th>Status</th>
                {isAdmin && <th style={{ width: 100 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map(v => {
                const accent = vendorAccent(v.name);
                const inits = initials(v.name);
                return (
                  <tr key={v.id}>
                    <td>
                      <div className="vendor-cell">
                        <div style={{
                          width: 46, height: 46,
                          borderRadius: '50%',
                          background: accent.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: accent.text, fontSize: '15px', fontWeight: 700,
                          flexShrink: 0, boxShadow: 'var(--sh-sm)',
                          overflow: 'hidden',
                        }}>
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(v.name)}&size=46&bold=true&format=png&background=0B2519&color=fff`}
                            alt={v.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = `<span style="font-size:15px;font-weight:700;color:${accent.text}">${inits}</span>`; }}
                          />
                        </div>
                        <div>
                          <div className="cell-primary">{v.name}</div>
                          <div className="cell-sub">📞 {v.telephone || 'No phone'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="cell-muted">{v.business_name || '—'}</td>
                    <td><span className="badge prov">📍 {v.location}</span></td>
                    <td className="cell-muted">{v.telephone || '—'}</td>
                    <td>
                      <span className={`badge ${v.status === 'Active' ? 'ok' : 'off'}`}>
                        {v.status === 'Active' ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="row-actions">
                          <button className="btn-icon" onClick={() => openEdit(v)}>✏️</button>
                          <button className="btn-icon danger" onClick={() => remove(v.id)}>🗑️</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={6}>
                  <div className="table-empty">
                    <div className="table-empty-icon">🏪</div>
                    <div className="table-empty-msg">No vendors registered yet</div>
                    <div className="table-empty-sub">Click "+ Register Vendor" to add your first vendor</div>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal
          title={modal.mode === 'add' ? '🏪 Register New Vendor' : '✏️ Edit Vendor'}
          onClose={() => setModal(null)}
          footer={<><button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn-primary" onClick={save}>💾 Save Vendor</button></>}
        >
          {err && <div className="form-error">⚠️ {err}</div>}
          <label>Vendor Full Name
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Thabo Mokhele" />
          </label>
          <label>Business / Stall Name
            <input value={form.business_name || ''} onChange={e => setForm({ ...form, business_name: e.target.value })} placeholder="e.g. Thabo's Fresh Market" />
          </label>
          <label>Telephone
            <input value={form.telephone || ''} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="+266 5x xxx xxxx" />
          </label>
          <label>Operating Location
            <select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}>
              <option value="">Select area in Maseru…</option>
              {LOCATIONS.map(l => <option key={l}>{l}</option>)}
            </select>
          </label>
          <label>Account Status
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </label>
        </Modal>
      )}
    </div>
  );
}
