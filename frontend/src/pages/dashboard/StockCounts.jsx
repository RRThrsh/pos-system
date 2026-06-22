import { useState, useEffect } from 'react'
import { stockCountsApi, productsApi } from '../../services/api.js'
import Spinner from '../../components/Spinner.jsx'
import { useToast } from '../../context/ToastContext.jsx'

function StockCounts() {
  const { addToast } = useToast()
  const [counts, setCounts] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedCount, setSelectedCount] = useState(null)
  const [items, setItems] = useState([{ productId: '', productName: '', expectedQty: 0, actualQty: 0 }])

  const loadData = async () => {
    setLoading(true)
    try {
      const [countsData, productsData] = await Promise.all([
        stockCountsApi.getAll(),
        productsApi.getAll()
      ])
      setCounts(countsData || [])
      setProducts(productsData || [])
    } catch (err) {
      addToast(err.message || 'Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleAddItem = () => {
    setItems([...items, { productId: '', productName: '', expectedQty: 0, actualQty: 0 }])
  }

  const handleItemChange = (index, field, value) => {
    const updated = [...items]
    updated[index][field] = value
    if (field === 'productId') {
      const prod = products.find(p => p._id === value)
      if (prod) {
        updated[index].productName = prod.name
        updated[index].expectedQty = prod.stock || 0
      }
    }
    setItems(updated)
  }

  const handleRemoveItem = (index) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    const validItems = items.filter(i => i.productId)
    if (validItems.length === 0) { addToast('Add at least one product', 'error'); return }
    try {
      await stockCountsApi.create({ items: validItems })
      addToast('Stock count recorded', 'success')
      setShowModal(false)
      setItems([{ productId: '', productName: '', expectedQty: 0, actualQty: 0 }])
      await loadData()
      setShowModal(false)
      setItems([{ productId: '', productName: '', expectedQty: 0, actualQty: 0 }])
      addToast('Stock count recorded', 'success')
      await loadData()
    } catch (err) {
      addToast(err.message || 'Failed to save stock count', 'error')
    }
  }

  const viewCount = async (id) => {
    try {
      const data = await stockCountsApi.getById(id)
      setSelectedCount(data)
    } catch (err) {
      addToast(err.message || 'Failed to load count details', 'error')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Stock Counts</h1>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          + New Count
        </button>
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-4">
          {counts.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400"><p>No stock counts yet.</p></div>
          ) : (
            counts.map((count) => (
              <div key={count._id} className="bg-white rounded-lg shadow p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm text-gray-500">{new Date(count.createdAt).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Items: {count.items?.length || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${count.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>{count.status || 'draft'}</p>
                    <button onClick={() => viewCount(count._id)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">View Details</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  {count.items?.slice(0, 4).map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded px-2 py-1">
                      <p className="font-medium text-gray-700 truncate">{item.productName}</p>
                      <p className="text-gray-500">{item.expectedQty} → {item.actualQty} ({item.variance >= 0 ? '+' : ''}{item.variance})</p>
                    </div>
                  ))}
                  {count.items?.length > 4 && <p className="text-gray-400 text-xs self-center">+{count.items.length - 4} more</p>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Stock Count</h2>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-end p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
                    <select value={item.productId} onChange={e => handleItemChange(i, 'productId', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select product</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name} (stock: {p.stock || 0})</option>)}
                    </select>
                  </div>
                  <div className="w-20">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Expected</label>
                    <input type="number" value={item.expectedQty} readOnly
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-gray-100" />
                  </div>
                  <div className="w-20">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Actual</label>
                    <input type="number" value={item.actualQty} onChange={e => handleItemChange(i, 'actualQty', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="w-16 text-right">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Variance</label>
                    <p className={`text-sm font-semibold ${item.actualQty !== item.expectedQty ? 'text-orange-600' : 'text-green-600'}`}>
                      {item.actualQty - item.expectedQty}
                    </p>
                  </div>
                  <button onClick={() => handleRemoveItem(i)} className="text-red-500 hover:text-red-700 px-1">&times;</button>
                </div>
              ))}
              <button onClick={handleAddItem} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">+ Add Item</button>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Save Count</button>
            </div>
          </div>
        </div>
      )}

      {selectedCount && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setSelectedCount(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Count Details</h2>
              <button onClick={() => setSelectedCount(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{new Date(selectedCount.createdAt).toLocaleString()} · {selectedCount.status}</p>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr><th className="text-left px-3 py-2 font-medium">Product</th><th className="text-right px-3 py-2 font-medium">Expected</th><th className="text-right px-3 py-2 font-medium">Actual</th><th className="text-right px-3 py-2 font-medium">Variance</th></tr>
              </thead>
              <tbody className="divide-y">
                {(selectedCount.items || []).map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900">{item.productName}</td>
                    <td className="px-3 py-2 text-right">{item.expectedQty}</td>
                    <td className="px-3 py-2 text-right">{item.actualQty}</td>
                    <td className={`px-3 py-2 text-right font-medium ${item.variance < 0 ? 'text-red-600' : item.variance > 0 ? 'text-orange-600' : 'text-green-600'}`}>{item.variance >= 0 ? '+' : ''}{item.variance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default StockCounts
