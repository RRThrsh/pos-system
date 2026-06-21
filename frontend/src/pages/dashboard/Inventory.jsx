import { useState, useEffect } from 'react'
import { inventoryApi, productsApi } from '../../services/api.js'
import Modal from '../../components/Modal.jsx'
import Spinner from '../../components/Spinner.jsx'
import { useToast } from '../../context/ToastContext.jsx'

function Inventory() {
  const { addToast } = useToast()
  const [movements, setMovements] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ productId: '', quantity: '', type: 'in', reason: '' })

  const load = () => {
    setLoading(true)
    Promise.all([
      inventoryApi.getMovements({ limit: '100' }),
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
        <button onClick={() => setModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-500 transition-colors">+ Adjust Stock</button>
      </div>

      {loading ? <Spinner /> : (
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
              {movements.map((m, i) => (
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
              {!movements.length && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No inventory movements found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Adjust Stock">
        <form onSubmit={handleAdjust} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              <option value="">Select product</option>
              {products.map((p) => (
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
