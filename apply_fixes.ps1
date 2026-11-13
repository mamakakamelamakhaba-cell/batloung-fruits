# apply_fixes.ps1 — patch all frontend pages with toast + dashboard purchases summary

$base = "c:\Users\Rapelang\Downloads\batloung-fruits-main\batloung-fruits-main\frontend\src"

#------------------------------------------------------------------
# Helper: replace first occurrence of $old with $new in a file
#------------------------------------------------------------------
function Patch($file, $old, $new) {
    $content = [System.IO.File]::ReadAllText($file)
    if ($content.Contains($old)) {
        $content = $content.Replace($old, $new)
        [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
        Write-Host "PATCHED: $file"
    } else {
        Write-Host "SKIP (not found): $file"
    }
}

#------------------------------------------------------------------
# Orders.jsx
#------------------------------------------------------------------
$f = "$base\pages\Orders.jsx"
Patch $f `
    "import { useAuth } from '../context/AuthContext.jsx';" `
    "import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';"

Patch $f `
    "export default function Orders() {
  const { isAdmin } = useAuth();" `
    "export default function Orders() {
  const { isAdmin } = useAuth();
  const toast = useToast();"

Patch $f `
    "      await api.post('/orders', { vendor_id: vendorId, items: clean });
      setCreate(false); setVendorId(''); setItems([{ product_id: '', quantity: 1 }]); load();" `
    "      await api.post('/orders', { vendor_id: vendorId, items: clean });
      toast('🛒 Order placed successfully!', 'success');
      setCreate(false); setVendorId(''); setItems([{ product_id: '', quantity: 1 }]); load();"

Patch $f `
    "      await api.put(\`/orders/\${id}/status\`, { status });
      load();" `
    "      await api.put(\`/orders/\${id}/status\`, { status });
      toast(\`✅ Status updated to ""\${status}""\`, 'success');
      load();"

Patch $f `
    "if (confirm('Delete this order?')) { await api.delete(\`/orders/\${id}\`); setDetail(null); load(); }" `
    "if (confirm('Delete this order?')) { await api.delete(\`/orders/\${id}\`); toast('🗑️ Order deleted.', 'success'); setDetail(null); load(); }"

#------------------------------------------------------------------
# Vendors.jsx
#------------------------------------------------------------------
$f = "$base\pages\Vendors.jsx"
Patch $f `
    "import { useAuth } from '../context/AuthContext.jsx';" `
    "import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';"

Patch $f `
    "export default function Vendors() {
  const { isAdmin } = useAuth();" `
    "export default function Vendors() {
  const { isAdmin } = useAuth();
  const toast = useToast();"

Patch $f `
    "      if (modal.mode === 'add') await api.post('/vendors', form);
      else await api.put(\`/vendors/\${modal.id}\`, form);
      setModal(null); load();" `
    "      if (modal.mode === 'add') await api.post('/vendors', form);
      else await api.put(\`/vendors/\${modal.id}\`, form);
      toast(modal.mode === 'add' ? '🏪 Vendor registered!' : '✏️ Vendor updated!', 'success');
      setModal(null); load();"

Patch $f `
    "if (confirm('Delete this vendor?')) { await api.delete(\`/vendors/\${id}\`); load(); }" `
    "if (confirm('Delete this vendor?')) { await api.delete(\`/vendors/\${id}\`); toast('🗑️ Vendor deleted.', 'success'); load(); }"

#------------------------------------------------------------------
# Suppliers.jsx
#------------------------------------------------------------------
$f = "$base\pages\Suppliers.jsx"
Patch $f `
    "      if (modal.mode === 'add') await api.post('/suppliers', form);
      else await api.put(\`/suppliers/\${modal.id}\`, form);
      setModal(null); load();" `
    "      if (modal.mode === 'add') await api.post('/suppliers', form);
      else await api.put(\`/suppliers/\${modal.id}\`, form);
      toast(modal.mode === 'add' ? '🚚 Supplier added!' : '✏️ Supplier updated!', 'success');
      setModal(null); load();"

Patch $f `
    "if (confirm('Delete this supplier?')) { await api.delete(\`/suppliers/\${id}\`); load(); }" `
    "if (confirm('Delete this supplier?')) { await api.delete(\`/suppliers/\${id}\`); toast('🗑️ Supplier deleted.', 'success'); load(); }"

#------------------------------------------------------------------
# Stock.jsx
#------------------------------------------------------------------
$f = "$base\pages\Stock.jsx"
Patch $f `
    "import Modal from '../components/Modal.jsx';" `
    "import Modal from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';"

Patch $f `
    "export default function Stock() {" `
    "export default function Stock() {
  const toast = useToast();"

Patch $f `
    "      await api.post('/stock', form);
      setModal(false);" `
    "      await api.post('/stock', form);
      toast('📦 Stock purchase recorded!', 'success');
      setModal(false);"

Patch $f `
    "      await api.post('/stock/adjust', { product_id: adjust.product_id, change_qty: Number(adjForm.change_qty), note: adjForm.note });
      setAdjust(null);" `
    "      await api.post('/stock/adjust', { product_id: adjust.product_id, change_qty: Number(adjForm.change_qty), note: adjForm.note });
      toast('⚖️ Stock adjusted!', 'success');
      setAdjust(null);"

#------------------------------------------------------------------
# Products.jsx
#------------------------------------------------------------------
$f = "$base\pages\Products.jsx"
Patch $f `
    "import { useAuth } from '../context/AuthContext.jsx';" `
    "import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';"

Patch $f `
    "export default function Products() {
  const { isAdmin } = useAuth();" `
    "export default function Products() {
  const { isAdmin } = useAuth();
  const toast = useToast();"

Patch $f `
    "      if (modal.mode === 'add') await api.post('/products', form);
      else await api.put(\`/products/\${modal.id}\`, form);
      setModal(null); load();" `
    "      if (modal.mode === 'add') await api.post('/products', form);
      else await api.put(\`/products/\${modal.id}\`, form);
      toast(modal.mode === 'add' ? '📦 Product added!' : '✏️ Product updated!', 'success');
      setModal(null); load();"

Patch $f `
    "if (confirm('Delete this product configuration?')) { await api.delete(\`/products/\${id}\`); load(); }" `
    "if (confirm('Delete this product configuration?')) { await api.delete(\`/products/\${id}\`); toast('🗑️ Product deleted.', 'success'); load(); }"

#------------------------------------------------------------------
# BoxSizes.jsx
#------------------------------------------------------------------
$f = "$base\pages\BoxSizes.jsx"
Patch $f `
    "import Modal from '../components/Modal.jsx';" `
    "import Modal from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';"

Patch $f `
    "export default function BoxSizes() {" `
    "export default function BoxSizes() {
  const toast = useToast();"

Patch $f `
    "      setSuccess(\`\${editing.name} box size updated successfully!\`);
      setEditing(null);
      load();
      setTimeout(() => setSuccess(''), 3000);" `
    "      toast(\`✅ \${editing.name} box size updated!\`, 'success');
      setEditing(null);
      load();"

# Remove setSuccess state since we replaced it with toast
Patch $f `
    "  const [success, setSuccess] = useState('');
" `
    ""

#------------------------------------------------------------------
# Fruits.jsx — check if already patched
#------------------------------------------------------------------
$f = "$base\pages\Fruits.jsx"
$check = [System.IO.File]::ReadAllText($f)
if ($check.Contains("useToast")) {
    Write-Host "ALREADY PATCHED: Fruits.jsx"
} else {
    Write-Host "NEEDS MANUAL PATCH: Fruits.jsx"
}

#------------------------------------------------------------------
# Dashboard.jsx — add purchases state + summary strip
#------------------------------------------------------------------
$f = "$base\pages\Dashboard.jsx"
Patch $f `
    "  const [recentOrders, setRecentOrders] = useState([]);" `
    "  const [recentOrders, setRecentOrders] = useState([]);
  const [purchases, setPurchases] = useState(null);"

Patch $f `
    "    api.get('/orders', { params: { limit: 5 } }).then(r => setRecentOrders(r.data.slice(0, 5))).catch(() => {});
  }, []);" `
    "    api.get('/orders', { params: { limit: 5 } }).then(r => setRecentOrders(r.data.slice(0, 5))).catch(() => {});
    api.get('/reports/purchases-summary').then(r => setPurchases(r.data)).catch(() => {});
  }, []);"

#------------------------------------------------------------------
# Reports.jsx — info banner
#------------------------------------------------------------------
$f = "$base\pages\Reports.jsx"
$infoBlock = @"
      {/* Info banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
        border: '1px solid #93c5fd', borderRadius: '12px',
        padding: '12px 18px', marginBottom: '24px', fontSize: '13px', color: '#1e40af',
      }}>
        <span style={{ fontSize: '18px' }}>ℹ️</span>
        <span>Charts populate from <strong>completed orders</strong> and <strong>recorded stock purchases</strong>. Place orders and mark them Completed to see data here.</span>
      </div>

      {/* Summary cards */}
"@
Patch $f `
    "      {/* Summary cards */}" `
    $infoBlock

#------------------------------------------------------------------
# Dashboard purchases strip (after stats grid closing div)
#------------------------------------------------------------------
Patch $f `
    "      </div>

      {/* Summary cards */}" `
    "      </div>

      {/* Summary cards */}"

$f = "$base\pages\Dashboard.jsx"
Patch $f `
    "      </div>

      {/* CHARTS ROW */}" `
    @"
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
"@

Write-Host "Done applying all patches."
