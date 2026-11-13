import { useEffect, useState } from 'react';
import api from '../api/client';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';

// Box Size icons per size name
const SIZE_ICON = { Small: '📦', Medium: '📦', Large: '📦' };
const SIZE_COLOR = {
  Small:  { bg: '#dcfce7', text: '#166534', accent: '#16a34a' },
  Medium: { bg: '#dbeafe', text: '#1e40af', accent: '#2563eb' },
  Large:  { bg: '#fef3c7', text: '#92400e', accent: '#d97706' },
};
const SIZE_DESC_HINT = {
  Small:  'e.g. Ideal for vendors with limited capital or lower daily demand.',
  Medium: 'e.g. For vendors with moderate customer flow and steady demand.',
  Large:  'e.g. For high-volume vendors who purchase in bulk for better margins.',
};

export default function BoxSizes() {
  const [sizes, setSizes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);  // the box size being edited
  const [form, setForm]       = useState({ description: '' });
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/boxsizes')
      .then(r => setSizes(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (s) => {
    setEditing(s);
    setForm({ description: s.description || '' });
    setErr('');
  };

  const save = async () => {
    setSaving(true); setErr('');
    try {
      await api.put(`/boxsizes/${editing.id}`, { description: form.description });
      setSuccess(`${editing.name} box size updated successfully!`);
      setEditing(null);
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setErr(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="▣ Box Size Management"
        subtitle="View and manage the three standard box sizes used for all products"
      />

      {/* Info notice — assignment rule */}
      <div style={{
        background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
        border: '1px solid #93c5fd',
        borderRadius: '12px',
        padding: '14px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}>
        <span style={{ fontSize: '20px', flexShrink: 0 }}>ℹ️</span>
        <div>
          <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '14px', marginBottom: '2px' }}>
            Fixed Box Sizes
          </div>
          <div style={{ color: '#1e3a8a', fontSize: '13px', lineHeight: 1.5 }}>
            The system supports exactly <strong>Small</strong>, <strong>Medium</strong> and <strong>Large</strong> box sizes
            as specified by business requirements. Box size <em>names</em> are fixed and cannot be changed.
            Administrators may update the <em>description</em> of each size.
          </div>
        </div>
      </div>

      {success && (
        <div style={{
          background: '#dcfce7', border: '1px solid #86efac', borderRadius: '10px',
          padding: '12px 20px', marginBottom: '20px', color: '#166534', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          ✅ {success}
        </div>
      )}

      {/* Three box size cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontSize: '14px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>⏳</div>
          Loading box sizes…
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', marginBottom: '32px' }}>
          {sizes.map(s => {
            const c = SIZE_COLOR[s.name] || SIZE_COLOR.Small;
            return (
              <div key={s.id} className="panel" style={{ border: `2px solid ${c.accent}22`, position: 'relative' }}>
                {/* Top colour accent bar */}
                <div style={{ height: '4px', background: c.accent, borderRadius: '10px 10px 0 0', margin: '-1px -1px 0', position: 'absolute', top: 0, left: 0, right: 0 }} />
                <div style={{ padding: '24px 24px 20px' }}>
                  {/* Badge */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: c.bg, color: c.text,
                    borderRadius: '20px', padding: '6px 16px',
                    fontWeight: 800, fontSize: '15px', marginBottom: '16px',
                    letterSpacing: '0.3px',
                  }}>
                    <span style={{ fontSize: '20px' }}>
                      {s.name === 'Small' ? '📦' : s.name === 'Medium' ? '🗃️' : '🏗️'}
                    </span>
                    {s.name}
                  </div>

                  {/* ID */}
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontFamily: 'monospace' }}>
                    ID: {s.id}
                  </div>

                  {/* Description */}
                  <div style={{ fontSize: '13px', color: 'var(--text-sec)', lineHeight: 1.6, minHeight: '52px', marginBottom: '20px' }}>
                    {s.description || <em style={{ color: 'var(--text-muted)' }}>No description set.</em>}
                  </div>

                  {/* Linked products count hint */}
                  <div style={{
                    background: 'var(--bg-alt)', borderRadius: '8px', padding: '8px 12px',
                    fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    <span>◈</span>
                    Used in products: each fruit has a {s.name} box variant
                  </div>

                  {/* Edit button */}
                  <button
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => openEdit(s)}
                  >
                    ✏️ Edit Description
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary table */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">📋 Box Size Overview</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Size Name</th>
              <th>Description</th>
              <th style={{ width: 120 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sizes.map(s => {
              const c = SIZE_COLOR[s.name] || SIZE_COLOR.Small;
              return (
                <tr key={s.id}>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: c.bg, color: c.text,
                      borderRadius: '20px', padding: '4px 14px',
                      fontWeight: 700, fontSize: '13px',
                    }}>
                      {s.name === 'Small' ? '📦' : s.name === 'Medium' ? '🗃️' : '🏗️'} {s.name}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-sec)', fontSize: '13px' }}>
                    {s.description || <em style={{ color: 'var(--text-muted)' }}>No description</em>}
                  </td>
                  <td>
                    <button className="btn-ghost" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => openEdit(s)}>
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              );
            })}
            {sizes.length === 0 && !loading && (
              <tr><td colSpan={3}>
                <div className="table-empty">
                  <div className="table-empty-icon">📦</div>
                  <div className="table-empty-msg">No box sizes found</div>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editing && (
        <Modal title={`Edit — ${editing.name} Box Size`} onClose={() => setEditing(null)}>
          <div style={{ padding: '4px 0 16px' }}>
            {/* Fixed name notice */}
            <div style={{
              background: '#f9fafb', border: '1px solid var(--border)', borderRadius: '10px',
              padding: '12px 16px', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '24px' }}>
                {editing.name === 'Small' ? '📦' : editing.name === 'Medium' ? '🗃️' : '🏗️'}
              </span>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--forest)', fontSize: '15px' }}>{editing.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Box size name is fixed and cannot be changed
                </div>
              </div>
            </div>

            {err && (
              <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', fontWeight: 600 }}>
                ⚠️ {err}
              </div>
            )}

            <div className="lf-group">
              <label className="lf-label">Description</label>
              <textarea
                className="lf-input"
                rows={3}
                style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '14px' }}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder={SIZE_DESC_HINT[editing.name] || 'Enter a description…'}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Hint: {SIZE_DESC_HINT[editing.name]}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={save} disabled={saving}>
                {saving ? 'Saving…' : '💾 Save Changes'}
              </button>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
