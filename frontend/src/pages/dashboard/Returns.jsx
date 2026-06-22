import { useState, useEffect } from 'react'
import { salesApi, auditLogsApi } from '../../services/api.js'
import Modal from '../../components/Modal.jsx'
import Spinner from '../../components/Spinner.jsx'
import Pagination, { PAGE_SIZE } from '../../components/Pagination.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { usePermission } from '../../hooks/usePermission.js'

function Returns() {
  const { addToast } = useToast()
  const { canExecute } = usePermission('Sales')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewItem, setViewItem] = useState(null)
  const [returnItems, setReturnItems] = useState([])
  const [returnReason, setReturnReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [page, setPage] = useState(1)

  const load = () => {
    setLoading(true)
    salesApi.getAll({ limit: '100' })
      .then((res) => setItems((res.sales || res.data || res || []).filter((s) => s.status !== 'voided')))
      .catch((err) => addToast(err.message || 'Failed to load', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openReturn = (sale) => {
    setViewItem(sale)
    setReturnReason('')
    setReturnItems((sale.items || []).map((item) => ({
      ...item,
      returnQty: 0,
    })))
  }

  const toggleReturn = (idx) => {
    setReturnItems((prev) => prev.map((item, i) =>
      i === idx ? { ...item, returnQty: item.returnQty > 0 ? 0 : item.qty } : item
    ))
  }

  const setQty = (idx, qty) => {
    setReturnItems((prev) => prev.map((item, i) =>
      i === idx ? { ...item, returnQty: Math.min(qty, item.qty) } : item
    ))
  }

  const handleReturn = async () => {
    const toReturn = returnItems.filter((i) => i.returnQty > 0)
    if (!toReturn.length) return
    setProcessing(true)
    try {
      const saleId = viewItem._id || viewItem.id
      const allItems = (viewItem.items || []).reduce((s, i) => s + (i.qty || i.quantity || 0), 0)
      const returnTotal = toReturn.reduce((s, i) => s + (i.qty || i.quantity || 0), 0)
      const isFullReturn = returnTotal >= allItems

      if (isFullReturn) {
        await salesApi.voidSale(saleId)
      } else {
        await salesApi.partialVoid(saleId, toReturn.map((i) => ({ productId: i.productId || i._id, qty: i.returnQty })))
      }
      const refundTotal = toReturn.reduce((s, i) => s + i.price * i.returnQty, 0)
      addToast(`Return processed. Refund: \u20B1${refundTotal.toLocaleString()}`, 'success')
      setViewItem(null)
      load()
    } catch (err) {
      addToast(err.message || 'Return failed', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (d) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Transaction ID</th>
                <th className="text-right px-4 py-3 font-medium">Items</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-left px-4 py-3 font-medium">Payment</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((sale) => (
                <tr key={sale._id || sale.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(sale.createdAt || sale.date)}</td>
                  <td className="px-4 py-3 text-gray-900 font-mono text-xs">{sale.transactionId || '—'}</td>
                  <td className="px-4 py-3 text-right">{sale.items?.reduce((s, i) => s + i.qty, 0) || 0}</td>
                  <td className="px-4 py-3 text-right font-medium">&#8369;{Number(sale.total || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{sale.paymentMethod || sale.payment}</td>
                  <td className="px-4 py-3 text-center">
                    {canExecute && <button onClick={() => openReturn(sale)} className="text-orange-600 hover:text-orange-800 font-medium">Return</button>}
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No completed sales found.</td></tr>
              )}
            </tbody>
          </table>
          <Pagination items={items} currentPage={page} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Process Return / Refund">
        {viewItem && (
          <div className="text-sm space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Sale Date</span>
              <span>{formatDate(viewItem.createdAt || viewItem.date)}</span>
            </div>
            <div className="border-t pt-3">
              <p className="font-medium text-gray-700 mb-2">Select items to return</p>
              <div className="space-y-2">
                {returnItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      checked={item.returnQty > 0}
                      onChange={() => toggleReturn(i)}
                      className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-gray-500">&#8369;{Number(item.price).toLocaleString()} x {item.qty}</p>
                    </div>
                    {item.returnQty > 0 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setQty(i, Math.max(0, item.returnQty - 1))}
                          className="w-6 h-6 rounded border border-gray-300 text-gray-500 hover:bg-gray-100"
                        >-</button>
                        <span className="w-6 text-center font-medium">{item.returnQty}</span>
                        <button
                          onClick={() => setQty(i, item.returnQty + 1)}
                          className="w-6 h-6 rounded border border-gray-300 text-gray-500 hover:bg-gray-100"
                        >+</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-2 flex justify-between text-base font-bold text-gray-900">
              <span>Refund Total</span>
              <span className="text-orange-600">&#8369;{returnItems.reduce((s, i) => s + i.price * i.returnQty, 0).toLocaleString()}</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Return Reason</label>
              <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Select reason...</option>
                <option value="defective">Defective / Damaged</option>
                <option value="wrong_item">Wrong Item</option>
                <option value="customer_request">Customer Request</option>
                <option value="exchange">Exchange</option>
                <option value="other">Other</option>
              </select>
            </div>
            <p className="text-xs text-gray-400">Processing a return will restore stock for selected items.</p>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setViewItem(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button
                onClick={handleReturn}
                disabled={processing || !returnItems.some((i) => i.returnQty > 0)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Process Return'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Returns
