import { useState, useEffect, useRef } from 'react'
import { productsApi, categoriesApi, downloadCSV } from '../../services/api.js'
import Modal from '../../components/Modal.jsx'
import Spinner from '../../components/Spinner.jsx'
import Pagination, { PAGE_SIZE } from '../../components/Pagination.jsx'
import { Button, InputField, Select, ConfirmDialog } from '../../components/index.js'
import { useToast } from '../../context/ToastContext.jsx'
import { usePermission } from '../../hooks/usePermission.js'
import JsBarcode from 'jsbarcode'

const emptyForm = { name: '', sku: '', price: '', cost: '', category: '', stock: '', barcode: '', unitValue: '', unit: '', minStock: '', maxStock: '', reorderPoint: '' }
const units = ['pcs', 'ml', 'L', 'g', 'kg', 'box', 'pack', 'sack', 'bottle', 'can']

function Products() {
  const { addToast } = useToast()
  const { canWrite, canExecute } = usePermission('Products')
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [bulkForm, setBulkForm] = useState({ type: 'percentage', value: '' })
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const barcodeSvg = useRef(null)
  const printSvg = useRef(null)
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [printProduct, setPrintProduct] = useState(null)
  const [printQty, setPrintQty] = useState(1)
  const [csvConfirmOpen, setCsvConfirmOpen] = useState(false)

  const openPrintBarcode = (product) => {
    setPrintProduct(product)
    setPrintQty(1)
    setPrintModalOpen(true)
  }

  useEffect(() => {
    if (printSvg.current && printProduct?.barcode) {
      try { JsBarcode(printSvg.current, printProduct.barcode, { format: 'CODE128', width: 2, height: 60, displayValue: true, fontSize: 16 }) } catch {}
    }
  }, [printProduct])

  const handlePrintBarcode = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    let labels = ''
    for (let i = 0; i < printQty; i++) {
      labels += `<div style="text-align:center;margin:10px;padding:10px;border:1px dashed #ccc;display:inline-block">
        <div style="font-weight:bold;margin-bottom:4px">${printProduct?.name}</div>
        <div>&#8369;${Number(printProduct?.price || 0).toLocaleString()}</div>
        <img src="${printSvg.current?.outerHTML ? 'data:image/svg+xml,' + encodeURIComponent(printSvg.current.outerHTML) : ''}" style="width:200px;height:60px" />
      </div>`
    }
    printWindow.document.write(`<html><head><title>Print Barcode</title></head><body style="text-align:center">${labels}<script>window.print();window.close();<\/script></body></html>`)
    printWindow.document.close()
    setPrintModalOpen(false)
  }

  useEffect(() => {
    if (barcodeSvg.current && form.barcode) {
      try { JsBarcode(barcodeSvg.current, form.barcode, { format: 'CODE128', width: 1.5, height: 40, displayValue: true }) } catch {}
    }
  }, [form.barcode])

  const load = () => {
    setLoading(true)
    Promise.all([
      productsApi.getAll({ search, limit: '100' }),
      categoriesApi.getAll(),
    ])
      .then(([prodRes, catRes]) => {
        setItems(prodRes.products || prodRes.data || prodRes || [])
        setCategories(catRes.categories || catRes.data || catRes || [])
      })
      .catch((err) => addToast(err.message || 'Failed to load', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1); load() }, [search])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      name: item.name || '', sku: item.sku || '', price: item.price?.toString() || '', cost: item.cost?.toString() || '',
      category: item.category || '', stock: item.stock?.toString() || '', barcode: item.barcode || '',
      unitValue: item.unitValue?.toString() || '', unit: item.unit || '',
      minStock: item.minStock?.toString() || '', maxStock: item.maxStock?.toString() || '', reorderPoint: item.reorderPoint?.toString() || '',
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const payload = {
      ...form, price: parseFloat(form.price), cost: parseFloat(form.cost), stock: parseInt(form.stock, 10),
      unitValue: form.unitValue ? parseFloat(form.unitValue) : undefined, unit: form.unit || undefined,
      minStock: form.minStock ? parseInt(form.minStock, 10) : undefined,
      maxStock: form.maxStock ? parseInt(form.maxStock, 10) : undefined,
      reorderPoint: form.reorderPoint ? parseInt(form.reorderPoint, 10) : undefined,
    }
    try {
      if (editing) { await productsApi.update(editing._id || editing.id, payload); addToast('Product updated', 'success') }
      else { await productsApi.create(payload); addToast('Product created', 'success') }
      setModalOpen(false); load()
    } catch (err) { addToast(err.message || 'Save failed', 'error') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    try { await productsApi.remove(id); addToast('Product deleted', 'success'); load() }
    catch (err) { addToast(err.message || 'Delete failed', 'error') }
  }

  const handleBulkUpdate = async () => {
    const ids = items.map((i) => i._id || i.id)
    const value = parseFloat(bulkForm.value)
    if (!ids.length || !value) return addToast('No products or no value', 'error')
    try {
      await productsApi.bulkUpdatePrice({
        productIds: ids,
        ...(bulkForm.type === 'fixed' ? { price: value } : { percentageAdjustment: value }),
      })
      addToast('Bulk price update applied', 'success')
      setBulkModalOpen(false); load()
    } catch (err) { addToast(err.message || 'Bulk update failed', 'error') }
  }

  const formatUnit = (item) => {
    if (item.unitValue && item.unit) return `${item.unitValue}${item.unit}`
    if (item.unit) return item.unit
    return ''
  }

  const calcMargin = (item) => {
    if (!item.cost || !item.price) return null
    return ((item.price - item.cost) / item.price * 100).toFixed(1)
  }

  const stockStatus = (item) => {
    if (item.stock <= 0) return { label: 'Out of Stock', color: 'text-red-600 font-bold' }
    if (item.reorderPoint && item.stock <= item.reorderPoint) return { label: `Reorder (${item.stock})`, color: 'text-orange-600 font-bold' }
    if (item.minStock && item.stock <= item.minStock) return { label: 'Low', color: 'text-yellow-600' }
    return { label: item.stock, color: '' }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <InputField name="search" placeholder="Search products..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs mb-0" />
          <Button variant="secondary" size="md" onClick={() => setCsvConfirmOpen(true)}>Export CSV</Button>
          {canWrite && <Button variant="secondary" size="md" onClick={() => setBulkModalOpen(true)}>Bulk Price</Button>}
        </div>
        {canWrite && <Button variant="primary" onClick={openCreate}>+ Add Product</Button>}
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">SKU</th>
                <th className="text-left px-4 py-3 font-medium">Unit</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-right px-4 py-3 font-medium">Price</th>
                <th className="text-right px-4 py-3 font-medium">Cost</th>
                <th className="text-right px-4 py-3 font-medium">Margin</th>
                <th className="text-right px-4 py-3 font-medium">Stock</th>
                <th className="text-right px-4 py-3 font-medium">Reorder</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item) => {
                const ss = stockStatus(item)
                const margin = calcMargin(item)
                return (
                  <tr key={item._id || item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-gray-600">{item.sku}</td>
                    <td className="px-4 py-3 text-gray-600">{formatUnit(item)}</td>
                    <td className="px-4 py-3 text-gray-600">{item.category}</td>
                    <td className="px-4 py-3 text-right">&#8369;{Number(item.price).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">&#8369;{Number(item.cost).toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right ${margin && Number(margin) < 20 ? 'text-red-600' : 'text-green-600'}`}>{margin ? `${margin}%` : '-'}</td>
                    <td className={`px-4 py-3 text-right ${ss.color}`}>{ss.label}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{item.reorderPoint || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="ghost" size="sm" onClick={() => openPrintBarcode(item)} title="Print Barcode"><svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.72 14.84l-2.12 2.12a3 3 0 0 0 0 4.24 3 3 0 0 0 4.24 0l2.12-2.12m0-11.28l2.12-2.12a3 3 0 0 1 4.24 0 3 3 0 0 1 0 4.24l-2.12 2.12M14.84 6.72l-8.12 8.12" /></svg></Button>
                      {canWrite && <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Edit</Button>}
                      {canExecute && <Button variant="danger" size="sm" onClick={() => handleDelete(item._id || item.id)}>Delete</Button>}
                    </td>
                  </tr>
                )
              })}
              {!items.length && <tr><td colSpan={10} className="text-center py-8 text-gray-400">No products found.</td></tr>}
            </tbody>
          </table>
          <Pagination items={items} currentPage={page} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Name" name="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <InputField label="SKU" name="sku" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Price" name="price" type="number" step="0.01" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <InputField label="Cost" name="cost" type="number" step="0.01" min="0" required value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <InputField label="Min Stock" name="minStock" type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
            <InputField label="Max Stock" name="maxStock" type="number" min="0" value={form.maxStock} onChange={(e) => setForm({ ...form, maxStock: e.target.value })} />
            <InputField label="Reorder Point" name="reorderPoint" type="number" min="0" value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })} placeholder="Alert when stock at" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Unit Value" name="unitValue" type="number" step="any" min="0" placeholder="e.g. 250, 1, 500" value={form.unitValue} onChange={(e) => setForm({ ...form, unitValue: e.target.value })} />
            <Select label="Unit" name="unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              <option value="">Select unit</option>
              {units.map((u) => <option key={u} value={u}>{u}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" name="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select category</option>
              {categories.map((cat) => <option key={cat._id || cat.id} value={cat.name}>{cat.name}</option>)}
            </Select>
            <InputField label="Barcode" name="barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          </div>
          {form.barcode && <div className="flex justify-center bg-gray-50 rounded-lg p-3"><svg ref={barcodeSvg} /></div>}
          <InputField label="Stock" name="stock" type="number" min="0" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={bulkModalOpen} onClose={() => setBulkModalOpen(false)} title="Bulk Price Update">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Apply to all {items.length} loaded products</p>
          <div className="flex gap-2">
            <Select name="bulkType" value={bulkForm.type} onChange={(e) => setBulkForm({ ...bulkForm, type: e.target.value })}>
              <option value="percentage">Adjust by %</option>
              <option value="fixed">Set fixed price</option>
            </Select>
            <InputField name="bulkValue" type="number" step="0.01" value={bulkForm.value} onChange={(e) => setBulkForm({ ...bulkForm, value: e.target.value })} placeholder={bulkForm.type === 'percentage' ? '+/- %' : 'New price'} className="flex-1" />
          </div>
          {bulkForm.type === 'percentage' && <p className="text-xs text-gray-400">Use positive number to increase, negative to decrease</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setBulkModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleBulkUpdate}>Apply</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={csvConfirmOpen}
        onClose={() => setCsvConfirmOpen(false)}
        onConfirm={() => { downloadCSV(['name', 'sku', 'price', 'cost', 'category', 'stock', 'barcode', 'minStock', 'maxStock', 'reorderPoint'], items, `products-${new Date().toISOString().slice(0, 10)}.csv`); setCsvConfirmOpen(false) }}
        title="Export Products CSV"
        message="You are about to export all loaded products to a CSV file. This may contain a large amount of data."
        confirmText="Export"
      />

      <Modal isOpen={printModalOpen} onClose={() => setPrintModalOpen(false)} title="Print Barcode Label">
        <div className="space-y-4 text-center">
          {printProduct && (
            <div className="bg-white border rounded-lg p-4 inline-block">
              <div className="font-semibold mb-1">{printProduct.name}</div>
              <div className="text-lg mb-2">&#8369;{Number(printProduct.price).toLocaleString()}</div>
              <svg ref={printSvg} />
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Number of copies</label>
            <InputField name="printQty" type="number" min={1} max={100} value={printQty} onChange={(e) => setPrintQty(Number(e.target.value))} className="w-24 text-center" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPrintModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handlePrintBarcode}>Print</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Products
