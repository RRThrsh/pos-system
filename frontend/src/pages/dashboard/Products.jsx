import { useState, useEffect, useRef } from 'react'
import { productsApi, categoriesApi, downloadCSV } from '../../services/api.js'
import Modal from '../../components/Modal.jsx'
import Spinner from '../../components/Spinner.jsx'
import Pagination, { PAGE_SIZE } from '../../components/Pagination.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { usePermission } from '../../hooks/usePermission.js'
import JsBarcode from 'jsbarcode'

const emptyForm = { name: '', sku: '', price: '', cost: '', category: '', stock: '', barcode: '', unitValue: '', unit: '' }

const units = ['pcs', 'ml', 'L', 'g', 'kg', 'box', 'pack', 'sack', 'bottle', 'can']

function Products() {
  const { addToast } = useToast()
  const { canWrite, canExecute } = usePermission('Products')
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const barcodeSvg = useRef(null)
  const printSvg = useRef(null)
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [printProduct, setPrintProduct] = useState(null)
  const [printQty, setPrintQty] = useState(1)

  const openPrintBarcode = (product) => {
    setPrintProduct(product)
    setPrintQty(1)
    setPrintModalOpen(true)
  }

  useEffect(() => {
    if (printSvg.current && printProduct?.barcode) {
      try {
        JsBarcode(printSvg.current, printProduct.barcode, { format: 'CODE128', width: 2, height: 60, displayValue: true, fontSize: 16 })
      } catch { }
    }
  }, [printProduct])

  const handlePrintBarcode = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    let labels = ''
    for (let i = 0; i < printQty; i++) {
      labels += `<div style="text-align:center;margin:10px;padding:10px;border:1px dashed #ccc;display:inline-block">
        <div style="font-weight:bold;margin-bottom:4px">${printProduct?.name}</div>
        <div>₱${Number(printProduct?.price || 0).toLocaleString()}</div>
        <img src="${printSvg.current?.outerHTML ? 'data:image/svg+xml,' + encodeURIComponent(printSvg.current.outerHTML) : ''}" style="width:200px;height:60px" />
      </div>`
    }
    printWindow.document.write(`<html><head><title>Print Barcode</title></head><body style="text-align:center">${labels}<script>window.print();window.close();<\/script></body></html>`)
    printWindow.document.close()
    setPrintModalOpen(false)
  }

  useEffect(() => {
    if (barcodeSvg.current && form.barcode) {
      try {
        JsBarcode(barcodeSvg.current, form.barcode, { format: 'CODE128', width: 1.5, height: 40, displayValue: true })
      } catch { }
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

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      name: item.name || '',
      sku: item.sku || '',
      price: item.price?.toString() || '',
      cost: item.cost?.toString() || '',
      category: item.category || '',
      stock: item.stock?.toString() || '',
      barcode: item.barcode || '',
      unitValue: item.unitValue?.toString() || '',
      unit: item.unit || '',
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      price: parseFloat(form.price),
      cost: parseFloat(form.cost),
      stock: parseInt(form.stock, 10),
      unitValue: form.unitValue ? parseFloat(form.unitValue) : undefined,
      unit: form.unit || undefined,
    }
    try {
      if (editing) {
        await productsApi.update(editing._id || editing.id, payload)
        addToast('Product updated', 'success')
      } else {
        await productsApi.create(payload)
        addToast('Product created', 'success')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      addToast(err.message || 'Save failed', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    try {
      await productsApi.remove(id)
      addToast('Product deleted', 'success')
      load()
    } catch (err) {
      addToast(err.message || 'Delete failed', 'error')
    }
  }

  const formatUnit = (item) => {
    if (item.unitValue && item.unit) return `${item.unitValue}${item.unit}`
    if (item.unit) return item.unit
    return ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Search products..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          <button onClick={() => downloadCSV(['name', 'sku', 'price', 'cost', 'category', 'stock', 'barcode'], items, `products-${new Date().toISOString().slice(0, 10)}.csv`)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 min-w-[120px]">Export CSV</button>
        </div>
        {canWrite && <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-500 transition-colors">+ Add Product</button>}
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
                <th className="text-right px-4 py-3 font-medium">Stock</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item) => (
                <tr key={item._id || item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.sku}</td>
                  <td className="px-4 py-3 text-gray-600">{formatUnit(item)}</td>
                  <td className="px-4 py-3 text-gray-600">{item.category}</td>
                  <td className="px-4 py-3 text-right">&#8369;{Number(item.price).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">&#8369;{Number(item.cost).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{item.stock}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => openPrintBarcode(item)} className="text-gray-500 hover:text-gray-700 mr-2" title="Print Barcode"><svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.72 14.84l-2.12 2.12a3 3 0 0 0 0 4.24 3 3 0 0 0 4.24 0l2.12-2.12m0-11.28l2.12-2.12a3 3 0 0 1 4.24 0 3 3 0 0 1 0 4.24l-2.12 2.12M14.84 6.72l-8.12 8.12" /></svg></button>
                    {canWrite && <button onClick={() => openEdit(item)} className="text-indigo-600 hover:text-indigo-800 mr-3">Edit</button>}
                    {canExecute && <button onClick={() => handleDelete(item._id || item.id)} className="text-red-600 hover:text-red-800">Delete</button>}
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No products found.</td></tr>
              )}
            </tbody>
          </table>
          <Pagination items={items} currentPage={page} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input type="number" step="0.01" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
              <input type="number" step="0.01" min="0" required value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Value</label>
              <input type="number" step="any" min="0" placeholder="e.g. 250, 1, 500" value={form.unitValue} onChange={(e) => setForm({ ...form, unitValue: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="">Select unit</option>
                {units.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id || cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
              <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
          {form.barcode && (
            <div className="flex justify-center bg-gray-50 rounded-lg p-3">
              <svg ref={barcodeSvg} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input type="number" min="0" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-500 transition-colors">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={printModalOpen} onClose={() => setPrintModalOpen(false)} title="Print Barcode Label">
        <div className="space-y-4 text-center">
          {printProduct && (
            <div className="bg-white border rounded-lg p-4 inline-block">
              <div className="font-semibold mb-1">{printProduct.name}</div>
              <div className="text-lg mb-2">₱{Number(printProduct.price).toLocaleString()}</div>
              <svg ref={printSvg} />
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Number of copies</label>
            <input type="number" min={1} max={100} value={printQty} onChange={(e) => setPrintQty(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm w-24 text-center" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setPrintModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button onClick={handlePrintBarcode} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Print</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Products
