
# Patch all files using line-by-line approach to handle CRLF
$base = "c:\Users\Rapelang\Downloads\batloung-fruits-main\batloung-fruits-main\frontend\src"

function PatchLines($filePath, $searchLine, $insertAfter) {
    $lines = [System.IO.File]::ReadAllLines($filePath)
    $found = $false
    $result = [System.Collections.Generic.List[string]]::new()
    foreach ($line in $lines) {
        $result.Add($line)
        if (-not $found -and $line.TrimEnd() -eq $searchLine.TrimEnd()) {
            foreach ($ins in $insertAfter) {
                $result.Add($ins)
            }
            $found = $true
        }
    }
    if ($found) {
        [System.IO.File]::WriteAllLines($filePath, $result.ToArray(), [System.Text.UTF8Encoding]::new($false))
        Write-Host "PATCHED  : $filePath (after: $searchLine)"
    } else {
        Write-Host "NOT FOUND: $searchLine  IN: $filePath"
    }
}

function ReplaceLine($filePath, $searchLine, $newLines) {
    $lines = [System.IO.File]::ReadAllLines($filePath)
    $found = $false
    $result = [System.Collections.Generic.List[string]]::new()
    foreach ($line in $lines) {
        if (-not $found -and $line.TrimEnd() -eq $searchLine.TrimEnd()) {
            foreach ($nl in $newLines) { $result.Add($nl) }
            $found = $true
        } else {
            $result.Add($line)
        }
    }
    if ($found) {
        [System.IO.File]::WriteAllLines($filePath, $result.ToArray(), [System.Text.UTF8Encoding]::new($false))
        Write-Host "REPLACED : $filePath (line: $searchLine)"
    } else {
        Write-Host "NOT FOUND: $searchLine  IN: $filePath"
    }
}

# ============================================================
# Orders.jsx
# ============================================================
$f = "$base\pages\Orders.jsx"
# 1. Add toast hook after isAdmin line
PatchLines $f "  const { isAdmin } = useAuth();" @("  const toast = useToast();")
# 2. Add toast after post /orders success
PatchLines $f "      await api.post('/orders', { vendor_id: vendorId, items: clean });" @("      toast('🛒 Order placed successfully!', 'success');")
# 3. Add toast after put /orders/id/status
PatchLines $f "      await api.put(\`/orders/\${id}/status\`, { status });" @("      toast(\`✅ Status updated to ""\${status}""\`, 'success');")
# 4. Add toast on delete
ReplaceLine $f "    if (confirm('Delete this order?')) { await api.delete(\`/orders/\${id}\`); setDetail(null); load(); }" `
    @("    if (confirm('Delete this order?')) { await api.delete(\`/orders/\${id}\`); toast('🗑️ Order deleted.', 'success'); setDetail(null); load(); }")

# ============================================================
# Vendors.jsx
# ============================================================
$f = "$base\pages\Vendors.jsx"
PatchLines $f "export default function Vendors() {" @("  const toast = useToast();")
PatchLines $f "      if (modal.mode === 'add') await api.post('/vendors', form);" @()  # will do replace instead

ReplaceLine $f "      setModal(null); load();" @(
    "      toast(modal.mode === 'add' ? '🏪 Vendor registered!' : '✏️ Vendor updated!', 'success');",
    "      setModal(null); load();"
)
ReplaceLine $f "    if (confirm('Delete this vendor?')) { await api.delete(\`/vendors/\${id}\`); load(); }" `
    @("    if (confirm('Delete this vendor?')) { await api.delete(\`/vendors/\${id}\`); toast('🗑️ Vendor deleted.', 'success'); load(); }")

# ============================================================
# Suppliers.jsx
# ============================================================
$f = "$base\pages\Suppliers.jsx"
# Check if already has toast import
$content = [System.IO.File]::ReadAllText($f)
if (-not $content.Contains("useToast")) {
    PatchLines $f "import { useToast } from '../components/Toast.jsx';" @()
    # It already has the import from previous session - check
    $lines = [System.IO.File]::ReadAllLines($f)
    $hasImport = $lines | Where-Object { $_ -match "useToast" }
    if (-not $hasImport) {
        PatchLines $f "import Modal from '../components/Modal.jsx';" @("import { useToast } from '../components/Toast.jsx';")
        PatchLines $f "export default function Suppliers() {" @("  const toast = useToast();")
    }
}
# Check toast hook
$content = [System.IO.File]::ReadAllText($f)
if (-not $content.Contains("const toast = useToast()")) {
    PatchLines $f "export default function Suppliers() {" @("  const toast = useToast();")
}
# Add toast calls
$lines = [System.IO.File]::ReadAllLines($f)
$hasToastSave = $lines | Where-Object { $_ -match "Supplier added!" }
if (-not $hasToastSave) {
    ReplaceLine $f "      setModal(null); load();" @(
        "      toast(modal.mode === 'add' ? '🚚 Supplier added!' : '✏️ Supplier updated!', 'success');",
        "      setModal(null); load();"
    )
}
$hasToastDel = $lines | Where-Object { $_ -match "Supplier deleted" }
if (-not $hasToastDel) {
    ReplaceLine $f "    if (confirm('Delete this supplier?')) { await api.delete(\`/suppliers/\${id}\`); load(); }" `
        @("    if (confirm('Delete this supplier?')) { await api.delete(\`/suppliers/\${id}\`); toast('🗑️ Supplier deleted.', 'success'); load(); }")
}

# ============================================================
# Stock.jsx
# ============================================================
$f = "$base\pages\Stock.jsx"
$content = [System.IO.File]::ReadAllText($f)
if (-not $content.Contains("const toast = useToast()")) {
    PatchLines $f "export default function Stock() {" @("  const toast = useToast();")
}
$lines = [System.IO.File]::ReadAllLines($f)
$hasStockToast = $lines | Where-Object { $_ -match "Stock purchase recorded" }
if (-not $hasStockToast) {
    PatchLines $f "      await api.post('/stock', form);" @("      toast('📦 Stock purchase recorded!', 'success');")
}
$hasAdjToast = $lines | Where-Object { $_ -match "Stock adjusted" }
if (-not $hasAdjToast) {
    PatchLines $f "      await api.post('/stock/adjust', { product_id: adjust.product_id, change_qty: Number(adjForm.change_qty), note: adjForm.note });" `
        @("      toast('⚖️ Stock adjusted!', 'success');")
}

# ============================================================
# Products.jsx
# ============================================================
$f = "$base\pages\Products.jsx"
$content = [System.IO.File]::ReadAllText($f)
if (-not $content.Contains("const toast = useToast()")) {
    PatchLines $f "export default function Products() {" @("  const toast = useToast();")
}
$lines = [System.IO.File]::ReadAllLines($f)
$hasProdToast = $lines | Where-Object { $_ -match "Product added" }
if (-not $hasProdToast) {
    # Find the save setModal(null) line in Products - it's shared with other files, need context
    # Read and do string replace approach
    $txt = [System.IO.File]::ReadAllText($f)
    $old = "      if (modal.mode === 'add') await api.post('/products', form);" + [char]13 + [char]10 + "      else await api.put(\`/products/\${modal.id}\`, form);" + [char]13 + [char]10 + "      setModal(null); load();"
    $new = "      if (modal.mode === 'add') await api.post('/products', form);" + [char]13 + [char]10 + "      else await api.put(\`/products/\${modal.id}\`, form);" + [char]13 + [char]10 + "      toast(modal.mode === 'add' ? '📦 Product added!' : '✏️ Product updated!', 'success');" + [char]13 + [char]10 + "      setModal(null); load();"
    if ($txt.Contains($old)) {
        [System.IO.File]::WriteAllText($f, $txt.Replace($old, $new), [System.Text.Encoding]::UTF8)
        Write-Host "PATCHED Products save"
    } else {
        Write-Host "Products save old pattern not found, trying LF only..."
        $old2 = "      if (modal.mode === 'add') await api.post('/products', form);" + [char]10 + "      else await api.put(\`/products/\${modal.id}\`, form);" + [char]10 + "      setModal(null); load();"
        $new2 = "      if (modal.mode === 'add') await api.post('/products', form);" + [char]10 + "      else await api.put(\`/products/\${modal.id}\`, form);" + [char]10 + "      toast(modal.mode === 'add' ? '📦 Product added!' : '✏️ Product updated!', 'success');" + [char]10 + "      setModal(null); load();"
        if ($txt.Contains($old2)) {
            [System.IO.File]::WriteAllText($f, $txt.Replace($old2, $new2), [System.Text.Encoding]::UTF8)
            Write-Host "PATCHED Products save (LF)"
        } else {
            Write-Host "COULD NOT PATCH Products save"
        }
    }
}
$lines2 = [System.IO.File]::ReadAllLines($f)
$hasProdDel = $lines2 | Where-Object { $_ -match "Product deleted" }
if (-not $hasProdDel) {
    ReplaceLine $f "    if (confirm('Delete this product configuration?')) { await api.delete(\`/products/\${id}\`); load(); }" `
        @("    if (confirm('Delete this product configuration?')) { await api.delete(\`/products/\${id}\`); toast('🗑️ Product deleted.', 'success'); load(); }")
}

# ============================================================
# BoxSizes.jsx
# ============================================================
$f = "$base\pages\BoxSizes.jsx"
$content = [System.IO.File]::ReadAllText($f)
if (-not $content.Contains("const toast = useToast()")) {
    PatchLines $f "export default function BoxSizes() {" @("  const toast = useToast();")
}
$lines = [System.IO.File]::ReadAllLines($f)
$hasBoxToast = $lines | Where-Object { $_ -match "box size updated" }
if (-not $hasBoxToast) {
    # Replace setSuccess line with toast
    ReplaceLine $f "      setSuccess(\`\${editing.name} box size updated successfully!\`);" `
        @("      toast(\`✅ \${editing.name} box size updated!\`, 'success');")
    ReplaceLine $f "      setTimeout(() => setSuccess(''), 3000);" @()
}

# ============================================================
# Fruits.jsx
# ============================================================
$f = "$base\pages\Fruits.jsx"
$content = [System.IO.File]::ReadAllText($f)
if (-not $content.Contains("useToast")) {
    PatchLines $f "import Modal from '../components/Modal.jsx';" @("import { useToast } from '../components/Toast.jsx';")
    PatchLines $f "export default function Fruits() {" @("  const toast = useToast();")
    # find save success and add toast
    Write-Host "TODO: add toast calls to Fruits manually"
} else {
    Write-Host "Fruits already has useToast"
}

# ============================================================
# Dashboard.jsx — purchases state
# ============================================================
$f = "$base\pages\Dashboard.jsx"
$content = [System.IO.File]::ReadAllText($f)
if (-not $content.Contains("setPurchases")) {
    PatchLines $f "  const [recentOrders, setRecentOrders] = useState([]);" `
        @("  const [purchases, setPurchases] = useState(null);")
    PatchLines $f "    api.get('/orders', { params: { limit: 5 } }).then(r => setRecentOrders(r.data.slice(0, 5))).catch(() => {});" `
        @("    api.get('/reports/purchases-summary').then(r => setPurchases(r.data)).catch(() => {});")
} else {
    Write-Host "Dashboard purchases already patched"
}

Write-Host "`nAll patches applied."
