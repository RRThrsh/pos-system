import { useState, useEffect } from 'react'
import { salesApi, productsApi } from '../../services/api.js'
import Modal from '../../components/Modal.jsx'
import Spinner from '../../components/Spinner.jsx'
import Pagination, { PAGE_SIZE } from '../../components/Pagination.jsx'
import { useToast } from '../../context/ToastContext.jsx'

function SalesHistory() {
  const { addToast } = useToast()
  const [items, setItems] = useState([])
  const [productMap, setProductMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [viewItem, setViewItem] = useState(null)
  const [page, setPage] = useState(1)

  const load = () => {
    setLoading(true)
    Promise.all([
      salesApi.getAll({ limit: '100' }),
      productsApi.getAll({ limit: '200' }),
    ])
      .then(([saleRes, prodRes]) => {
        setItems(saleRes.sales || saleRes.data || saleRes || [])
        const products = prodRes.products || prodRes.data || prodRes || []
        const map = {}
        products.forEach((p) => { map[p._id || p.id] = p.cost || 0 })
        setProductMap(map)
      })
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

  const calcProfit = (sale) => {
    const items = sale.items || []
    let profit = 0
    for (const item of items) {
      const cost = productMap[item.productId] || 0
      const qty = item.qty || item.quantity || 0
      profit += (item.price - cost) * qty
    }
    return profit
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
                <th className="text-left px-4 py-3 font-medium">Order Type</th>
                <th className="text-right px-4 py-3 font-medium">Items</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-right px-4 py-3 font-medium">Profit</th>
                <th className="text-left px-4 py-3 font-medium">Payment</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((sale) => (
                <tr key={sale._id || sale.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(sale.createdAt || sale.date)}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{sale.orderType || 'dine-in'}</td>
                  <td className="px-4 py-3 text-right">{sale.items?.reduce((s, i) => s + (i.qty || i.quantity || 0), 0) || 0}</td>
                  <td className="px-4 py-3 text-right font-medium">&#8369;{Number(sale.total || sale.grandTotal || 0).toLocaleString()}</td>
                  <td className={`px-4 py-3 text-right font-medium ${calcProfit(sale) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    &#8369;{calcProfit(sale).toLocaleString()}
                  </td>
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
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No sales found.</td></tr>
              )}
            </tbody>
          </table>
          <Pagination items={items} currentPage={page} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Sale Details">
        {viewItem && (
          <div className="text-sm space-y-3">
            <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{formatDate(viewItem.createdAt || viewItem.date)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Order Type</span><span className="capitalize">{viewItem.orderType || 'dine-in'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="capitalize">{viewItem.paymentMethod || viewItem.payment}</span></div>
            {viewItem.discount > 0 && (
              <div className="flex justify-between"><span className="text-gray-500">Discount</span><span>{viewItem.discountType === 'percentage' ? `${viewItem.discount}%` : `&#8369;${Number(viewItem.discount).toLocaleString()}`}</span></div>
            )}
            <div className="flex justify-between"><span className="text-gray-500">Profit</span><span className={calcProfit(viewItem) < 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>&#8369;{calcProfit(viewItem).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`font-medium ${viewItem.status === 'voided' ? 'text-red-600' : 'text-green-600'}`}>{viewItem.status || 'completed'}</span></div>
            <div className="border-t pt-3">
              <p className="font-medium text-gray-700 mb-2">Items</p>
              <div className="space-y-1">
                {(viewItem.items || []).map((item, i) => {
                  const cost = productMap[item.productId] || 0
                  const qty = item.qty || item.quantity || 0
                  const itemProfit = (item.price - cost) * qty
                  return (
                    <div key={i} className="flex justify-between text-gray-600">
                      <span>{item.name || item.productName || item.product?.name} x{qty}</span>
                      <span>&#8369;{(item.price * qty).toLocaleString()} {itemProfit !== 0 && <span className={itemProfit < 0 ? 'text-red-500' : 'text-green-500'}>(&#8369;{itemProfit.toLocaleString()})</span>}</span>
                    </div>
                  )
                })}
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
