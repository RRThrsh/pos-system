import { useState, useEffect } from 'react'
import { salesApi } from '../../services/api.js'
import Modal from '../../components/Modal.jsx'
import Spinner from '../../components/Spinner.jsx'
import { useToast } from '../../context/ToastContext.jsx'

function SalesHistory() {
  const { addToast } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewItem, setViewItem] = useState(null)

  const load = () => {
    setLoading(true)
    salesApi.getAll({ limit: '100' })
      .then((res) => setItems(res.sales || res.data || res || []))
      .catch((err) => addToast(err.message || 'Failed to load', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleVoid = async (id) => {
    if (!confirm('Void this sale? This action cannot be undone.')) return
    try {
      await salesApi.voidSale(id)
      addToast('Sale voided', 'success')
      load()
    } catch (err) {
      addToast(err.message || 'Void failed', 'error')
    }
  }

  const formatDate = (d) => {
    if (!d) return '-'
    const date = new Date(d)
    return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Sales History</h1>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-right px-4 py-3 font-medium">Items</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-left px-4 py-3 font-medium">Payment</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((sale) => (
                <tr key={sale._id || sale.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(sale.createdAt || sale.date)}</td>
                  <td className="px-4 py-3 text-gray-900">{sale.customer?.name || sale.customerName || 'Walk-in'}</td>
                  <td className="px-4 py-3 text-right">{sale.items?.reduce((s, i) => s + i.quantity, 0) || 0}</td>
                  <td className="px-4 py-3 text-right font-medium">&#8369;{Number(sale.total || sale.grandTotal || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{sale.paymentMethod || sale.payment}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sale.status === 'voided' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {sale.status || 'completed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setViewItem(sale)} className="text-indigo-600 hover:text-indigo-800 mr-3">View</button>
                    {sale.status !== 'voided' && (
                      <button onClick={() => handleVoid(sale._id || sale.id)} className="text-red-600 hover:text-red-800">Void</button>
                    )}
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No sales found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Sale Details">
        {viewItem && (
          <div className="text-sm space-y-3">
            <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{formatDate(viewItem.createdAt || viewItem.date)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Customer</span><span>{viewItem.customer?.name || viewItem.customerName || 'Walk-in'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="capitalize">{viewItem.paymentMethod || viewItem.payment}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`font-medium ${viewItem.status === 'voided' ? 'text-red-600' : 'text-green-600'}`}>{viewItem.status || 'completed'}</span></div>
            <div className="border-t pt-3">
              <p className="font-medium text-gray-700 mb-2">Items</p>
              <div className="space-y-1">
                {(viewItem.items || []).map((item, i) => (
                  <div key={i} className="flex justify-between text-gray-600">
                    <span>{item.name || item.product?.name} x{item.quantity}</span>
                    <span>&#8369;{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-2 flex justify-between text-base font-bold text-gray-900">
              <span>Total</span>
              <span>&#8369;{Number(viewItem.total || viewItem.grandTotal || 0).toLocaleString()}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default SalesHistory
