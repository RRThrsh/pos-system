import { useState, useEffect } from 'react'
import { inventoryApi, productsApi, downloadCSV } from '../../services/api.js'
import Modal from '../../components/Modal.jsx'
import Spinner from '../../components/Spinner.jsx'
import Pagination, { PAGE_SIZE } from '../../components/Pagination.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { usePermission } from '../../hooks/usePermission.js'

function Inventory() {
  const { addToast } = useToast()
  const { canWrite } = usePermission('Inventory')
  const [movements, setMovements] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
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
          <input type="text" placeholder="Search products..." value={search}
            onChange={(e) => { setSearch(e.target.value); setStockPage(1) }}
            className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          {tab === 'stock' && <button onClick={() => downloadCSV(['name', 'sku', 'stock', 'category'], filteredStock, `inventory-stock-${new Date().toISOString().slice(0, 10)}.csv`)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 min-w-[120px]">Export CSV</button>}
          {tab === 'movements' && <button onClick={() => downloadCSV(['productName', 'type', 'quantity', 'reason', 'date'], sortedMovements, `inventory-movements-${new Date().toISOString().slice(0, 10)}.csv`)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 min-w-[120px]">Export CSV</button>}
        </div>
        {canWrite && <button onClick={() => setModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-500 transition-colors">+ Adjust Stock</button>}
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('stock')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'stock' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Stock Levels
        </button>
        <button
          onClick={() => setTab('movements')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'movements' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Movement History
        </button>
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
                      <td className={`px-4 py-3 text-right font-medium ${p.stock <= 5 ? 'text-red-600' : p.stock <= 10 ? 'text-yellow-600' : 'text-gray-900'}`}>{p.stock}</td>
                      <td className="px-4 py-3 text-right">
                        {p.stock === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Out of Stock</span>
                        ) : p.stock <= 5 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Critical</span>
                        ) : p.stock <= 10 ? (
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Adjust Stock">
        <form onSubmit={handleAdjust} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              <option value="">Select product</option>
              {[...products].sort((a, b) => (a.stock || 0) - (b.stock || 0)).map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>{p.name} (Stock: {p.stock})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="in">Stock In</option>
                <option value="out">Stock Out</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" min="1" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Delivery, spoilage, count adjustment" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-500 transition-colors">Save Adjustment</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Inventory
