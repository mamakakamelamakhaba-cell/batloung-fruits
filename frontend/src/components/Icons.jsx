/* ============================================================
   BATLOUNG FRUITS – Navigation Icons
   Uses real fruit images + clean emoji for a premium look
   ============================================================ */

const imgStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  objectFit: 'cover',
  display: 'block',
  flexShrink: 0,
};

const emojiStyle = {
  fontSize: '24px',
  lineHeight: 1,
  display: 'block',
};

// Nav icons — real images where available, premium emoji otherwise
export const IconDashboard  = () => <span style={emojiStyle}>📊</span>;
export const IconFruits     = () => <img src="/images/apple.jpg"    alt="Fruits"    style={imgStyle} onError={e => { e.target.style.display='none'; e.target.insertAdjacentHTML('afterend','<span style="font-size:24px">🍎</span>'); }} />;
export const IconProducts   = () => <img src="/images/mango.jpg"    alt="Products"  style={imgStyle} onError={e => { e.target.style.display='none'; e.target.insertAdjacentHTML('afterend','<span style="font-size:24px">📦</span>'); }} />;
export const IconSuppliers  = () => <span style={emojiStyle}>🚛</span>;
export const IconVendors    = () => <span style={emojiStyle}>🏪</span>;
export const IconStock      = () => <img src="/images/warehouse_stock.jpg" alt="Stock" style={imgStyle} onError={e => { e.target.style.display='none'; e.target.insertAdjacentHTML('afterend','<span style="font-size:24px">🏭</span>'); }} />;
export const IconOrders     = () => <span style={emojiStyle}>🛒</span>;
export const IconReports    = () => <span style={emojiStyle}>📈</span>;
export const IconBoxSizes   = () => <span style={emojiStyle}>🗃️</span>;

// Status / misc icons used in tables and badges
export const IconCheck   = () => <span style={{ fontSize: '14px' }}>✅</span>;
export const IconX       = () => <span style={{ fontSize: '14px' }}>❌</span>;
export const IconWarning = () => <span style={{ fontSize: '14px' }}>⚠️</span>;
export const IconInfo    = () => <span style={{ fontSize: '14px' }}>ℹ️</span>;
export const IconEdit    = () => <span style={{ fontSize: '14px' }}>✏️</span>;
export const IconDelete  = () => <span style={{ fontSize: '14px' }}>🗑️</span>;
export const IconPlus    = () => <span style={{ fontSize: '14px' }}>➕</span>;
export const IconSearch  = () => <span style={{ fontSize: '14px' }}>🔍</span>;
export const IconFilter  = () => <span style={{ fontSize: '14px' }}>🔽</span>;
export const IconExport  = () => <span style={{ fontSize: '14px' }}>📤</span>;
export const IconRefresh = () => <span style={{ fontSize: '14px' }}>🔄</span>;
export const IconDown    = () => <span style={{ fontSize: '12px' }}>▼</span>;
export const IconUp      = () => <span style={{ fontSize: '12px' }}>▲</span>;
