import { useState, useEffect } from 'react'
import { inventoryApi, productsApi, downloadCSV } from '../../services/api.js'
import Modal from '../../components/Modal.jsx'
import Spinner from '../../components/Spinner.jsx'
import Pagination, { PAGE_SIZE } from '../../components/Pagination.jsx'
import { Button, InputField, Select, ConfirmDialog } from '../../components/index.js'
import { useToast } from '../../context/ToastContext.jsx'
import { usePermission } from '../../hooks/usePermission.js'

function Inventory() {
  const { addToast } = useToast()
  const { canWrite } = usePermission('Inventory')
  const [movements, setMovements] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [csvConfirmOpen, setCsvConfirmOpen] = useState(false)
  const [csvTab, setCsvTab] = useState('stock')
  const [form, setForm] = useState({ productId: '', quantity: '', type: 'in', reason: '' })
  const [stockPage, setStockPage] = useState(1)
  const [movPage, setMovPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('stock')

  const load = () => {
    setLoading(true)
    Promise.all([
      inventoryApi.getMovements({ limit: '999' }),
      productsApi.getAll({ limit: '200' }),
    ])
      .then(([movRes, prodRes]) => {
        setMovements(movRes.movements || movRes.data || movRes || [])
        setProducts(prodRes.products || prodRes.data || prodRes || [])
      })
      .catch((err) => addToast(err.message || 'Failed to load', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleAdjust = async (e) => {
    e.preventDefault()
    if (!form.productId || !form.quantity) return
    try {
      await inventoryApi.adjust({
        productId: form.productId,
        quantity: parseInt(form.quantity, 10),
        type: form.type,
        reason: form.reason,
      })
      addToast('Stock adjusted', 'success')
      setModalOpen(false)
      setForm({ productId: '', quantity: '', type: 'in', reason: '' })
      load()
    } catch (err) {
      addToast(err.message || 'Adjustment failed', 'error')
    }
  }

  const formatDate = (d) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const sortedStock = [...products]
    .sort((a, b) => (a.stock || 0) - (b.stock || 0))

  const filteredStock = search
    ? sortedStock.filter((p) =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())
      )
    : sortedStock

  const sortedMovements = [...movements]
    .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <InputField name="search" placeholder="Search products..." value={search}
            onChange={(e) => { setSearch(e.target.value); setStockPage(1) }}
            className="max-w-xs mb-0" />
          {tab === 'stock' && <Button variant="secondary" size="md" onClick={() => { setCsvTab('stock'); setCsvConfirmOpen(true) }}>Export CSV</Button>}
          {tab === 'movements' && <Button variant="secondary" size="md" onClick={() => { setCsvTab('movements'); setCsvConfirmOpen(true) }}>Export CSV</Button>}
        </div>
        {canWrite && <Button variant="primary" onClick={() => setModalOpen(true)}>+ Adjust Stock</Button>}
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTab('stock')}
          className={tab === 'stock' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}
        >
          Stock Levels
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTab('movements')}
          className={tab === 'movements' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}
        >
          Movement History
        </Button>
      </div>

      {loading ? <Spinner /> : (
        <>
          {tab === 'stock' && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Product</th>
                    <th className="text-left px-4 py-3 font-medium">SKU</th>
                    <th className="text-left px-4 py-3 font-medium">Category</th>
                    <th className="text-right px-4 py-3 font-medium">Price</th>
                    <th className="text-right px-4 py-3 font-medium">Stock</th>
                    <th className="text-right px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStock.slice((stockPage - 1) * PAGE_SIZE, stockPage * PAGE_SIZE).map((p) => (
                    <tr key={p._id || p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600">{p.sku}</td>
                      <td className="px-4 py-3 text-gray-600">{p.category}</td>
                      <td className="px-4 py-3 text-right">&#8369;{Number(p.price).toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-medium ${p.stock <= 0 ? 'text-red-600 font-bold' : p.reorderPoint && p.stock <= p.reorderPoint ? 'text-orange-600 font-bold' : p.stock <= 5 ? 'text-yellow-600' : 'text-gray-900'}`}>{p.stock}</td>
                      <td className="px-4 py-3 text-right">
                        {p.stock === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Out of Stock</span>
                        ) : p.reorderPoint && p.stock <= p.reorderPoint ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Reorder</span>
                        ) : p.stock <= 5 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Low</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">In Stock</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!filteredStock.length && (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">{search ? 'No products match your search.' : 'No products found.'}</td></tr>
                  )}
                </tbody>
              </table>
              <Pagination items={filteredStock} currentPage={stockPage} onPageChange={setStockPage} />
            </div>
          )}

          {tab === 'movements' && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                    <th className="text-left px-4 py-3 font-medium">Product</th>
                    <th className="text-center px-4 py-3 font-medium">Type</th>
                    <th className="text-right px-4 py-3 font-medium">Quantity</th>
                    <th className="text-left px-4 py-3 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedMovements.slice((movPage - 1) * PAGE_SIZE, movPage * PAGE_SIZE).map((m, i) => (
                    <tr key={m._id || m.id || i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(m.createdAt || m.date)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{m.product?.name || m.productName || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${m.type === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {m.type === 'in' ? 'IN' : 'OUT'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{m.quantity}</td>
                      <td className="px-4 py-3 text-gray-600">{m.reason || '-'}</td>
                    </tr>
                  ))}
                  {!sortedMovements.length && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No inventory movements found.</td></tr>
                  )}
                </tbody>
              </table>
              <Pagination items={sortedMovements} currentPage={movPage} onPageChange={setMovPage} />
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={csvConfirmOpen}
        onClose={() => setCsvConfirmOpen(false)}
        onConfirm={() => {
          if (csvTab === 'stock') {
            downloadCSV(['name', 'sku', 'stock', 'category'], filteredStock, `inventory-stock-${new Date().toISOString().slice(0, 10)}.csv`)
          } else {
            downloadCSV(['productName', 'type', 'quantity', 'reason', 'date'], sortedMovements, `inventory-movements-${new Date().toISOString().slice(0, 10)}.csv`)
          }
          setCsvConfirmOpen(false)
        }}
        title="Export Inventory CSV"
        message="You are about to export inventory data to a CSV file. This may contain a large amount of data."
        confirmText="Export"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Adjust Stock">
        <form onSubmit={handleAdjust} className="space-y-3">
          <Select label="Product" name="productId" required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
            <option value="">Select product</option>
            {[...products].sort((a, b) => (a.stock || 0) - (b.stock || 0)).map((p) => (
              <option key={p._id || p.id} value={p._id || p.id}>{p.name} (Stock: {p.stock})</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" name="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
            </Select>
            <InputField label="Quantity" name="quantity" type="number" min="1" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <InputField label="Reason" name="reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Delivery, spoilage, count adjustment" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save Adjustment</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Inventory
