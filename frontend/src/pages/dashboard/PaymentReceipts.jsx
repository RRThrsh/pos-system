import { useState, useEffect } from 'react'
import { salesApi } from '../../services/api.js'
import Modal from '../../components/Modal.jsx'
import Spinner from '../../components/Spinner.jsx'
import Pagination, { PAGE_SIZE } from '../../components/Pagination.jsx'
import { useToast } from '../../context/ToastContext.jsx'

function PaymentReceipts() {
  const { addToast } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [viewItem, setViewItem] = useState(null)
  const [paymentFilter, setPaymentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = () => {
    setLoading(true)
    salesApi.getAll({ limit: '100' })
      .then((res) => {
        const list = res.sales || res.data || res || []
        setItems(Array.isArray(list) ? list : [])
      })
      .catch((err) => addToast(err.message || 'Failed to load', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const formatDate = (d) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const paymentStatusBadge = (status) => {
    if (!status) return null
    const colors = {
      succeeded: 'bg-green-100 text-green-700',
      requires_capture: 'bg-yellow-100 text-yellow-700',
      requires_confirmation: 'bg-blue-100 text-blue-700',
      requires_payment_method: 'bg-orange-100 text-orange-700',
      processing: 'bg-blue-100 text-blue-700',
      failed: 'bg-red-100 text-red-700',
      canceled: 'bg-gray-100 text-gray-600',
    }
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[status] || 'bg-gray-100 text-gray-500'}`}>{status}</span>
  }

  const saleStatusBadge = (status) => {
    if (status === 'voided') return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">Voided</span>
    if (status === 'partially-returned') return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-700">Partially Returned</span>
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">Completed</span>
  }

  let filtered = items
  if (paymentFilter) filtered = filtered.filter((s) => (s.paymentMethod || '').toLowerCase() === paymentFilter.toLowerCase())
  if (statusFilter) filtered = filtered.filter((s) => (s.paymentStatus || '') === statusFilter)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const paymentMethods = [...new Set(items.map((s) => s.paymentMethod).filter(Boolean))]
  const paymentStatuses = [...new Set(items.map((s) => s.paymentStatus).filter(Boolean))]

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1) }} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none bg-white">
          <option value="">All Payment Methods</option>
          {paymentMethods.map((pm) => <option key={pm} value={pm}>{pm}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none bg-white">
          <option value="">All Payment Statuses</option>
          {paymentStatuses.map((ps) => <option key={ps} value={ps}>{ps}</option>)}
        </select>
        <span className="text-sm text-gray-400 ml-auto">{filtered.length} receipt{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Receipt #</th>
                <th className="text-left px-4 py-3 font-medium">Transaction ID</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Payment Method</th>
                <th className="text-center px-4 py-3 font-medium">Payment Status</th>
                <th className="text-center px-4 py-3 font-medium">Sale Status</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((sale) => (
                <tr key={sale._id || sale.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{sale.receiptNumber || '-'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{sale.transactionId || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(sale.createdAt)}</td>
                  <td className="px-4 py-3 capitalize text-gray-700 font-medium">{sale.paymentMethod || '-'}</td>
                  <td className="px-4 py-3 text-center">{paymentStatusBadge(sale.paymentStatus)}</td>
                  <td className="px-4 py-3 text-center">{saleStatusBadge(sale.status)}</td>
                  <td className="px-4 py-3 text-right font-medium">&#8369;{Number(sale.total || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setViewItem(sale)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">View</button>
                  </td>
                </tr>
              ))}
              {!paginated.length && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No payment receipts found.</td></tr>
              )}
            </tbody>
          </table>
          <Pagination items={filtered} currentPage={page} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Payment Receipt Details">
        {viewItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Receipt #</span>
                <p className="font-mono font-medium">{viewItem.receiptNumber || '-'}</p>
              </div>
              <div>
                <span className="text-gray-400">Transaction ID</span>
                <p className="font-mono text-xs">{viewItem.transactionId || '-'}</p>
              </div>
              <div>
                <span className="text-gray-400">Date</span>
                <p>{formatDate(viewItem.createdAt)}</p>
              </div>
              <div>
                <span className="text-gray-400">Payment Method</span>
                <p className="capitalize font-medium">{viewItem.paymentMethod || '-'}</p>
              </div>
              <div>
                <span className="text-gray-400">Payment Status</span>
                <p>{paymentStatusBadge(viewItem.paymentStatus)}</p>
              </div>
              <div>
                <span className="text-gray-400">Sale Status</span>
                <p>{saleStatusBadge(viewItem.status)}</p>
              </div>
              <div>
                <span className="text-gray-400">Total</span>
                <p className="font-bold text-lg">&#8369;{Number(viewItem.total || 0).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-400">Amount Paid</span>
                <p>&#8369;{Number(viewItem.amountPaid || 0).toLocaleString()}</p>
              </div>
            </div>

            {viewItem.paymentIntentId && (
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-xs text-gray-400">Payment Intent ID</span>
                <p className="font-mono text-xs text-gray-700 mt-0.5">{viewItem.paymentIntentId}</p>
              </div>
            )}

            {viewItem.items && viewItem.items.length > 0 && (
              <div>
                <span className="text-xs text-gray-400 block mb-2">Items</span>
                <div className="divide-y divide-gray-100 border rounded-lg">
                  {viewItem.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="text-gray-700">{item.productName || 'Unknown'} <span className="text-gray-400">x{item.qty || item.quantity}</span></span>
                      <span className="font-medium">&#8369;{Number(item.total || item.price * (item.qty || item.quantity) || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewItem.customerName && (
              <div className="text-sm">
                <span className="text-gray-400">Customer</span>
                <p>{viewItem.customerName}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default PaymentReceipts
