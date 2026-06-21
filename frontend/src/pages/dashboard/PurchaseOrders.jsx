import { useState, useEffect } from 'react'
import { purchaseOrdersApi, suppliersApi, productsApi } from '../../services/api.js'
import Modal from '../../components/Modal.jsx'
import Spinner from '../../components/Spinner.jsx'
import Pagination, { PAGE_SIZE } from '../../components/Pagination.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { usePermission } from '../../hooks/usePermission.js'

const statusColors = { pending: 'bg-yellow-100 text-yellow-800', ordered: 'bg-blue-100 text-blue-800', received: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800' }

function PurchaseOrders() {
  const { addToast } = useToast()
  const { canWrite, canExecute } = usePermission('Purchase Orders')
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [items, setItems] = useState([{ productId: '', productName: '', qty: 1, unitCost: 0, total: 0 }])
  const [notes, setNotes] = useState('')

  const load = () => {
    setLoading(true)
    purchaseOrdersApi.getAll({ status: statusFilter, page, limit: PAGE_SIZE })
      .then((res) => { setOrders(res.data || []); setTotal(res.total || 0) })
      .catch((err) => addToast(err.message || 'Failed to load', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, statusFilter])

  const openCreate = () => {
    Promise.all([suppliersApi.getAll({}), productsApi.getAll({ limit: '500' })])
      .then(([sRes, pRes]) => {
        setSuppliers(sRes.data || sRes || [])
        setProducts(pRes.products || pRes.data || [])
        setSelectedSupplier('')
        setItems([{ productId: '', productName: '', qty: 1, unitCost: 0, total: 0 }])
        setNotes('')
        setModalOpen(true)
      })
  }

  const addItem = () => setItems([...items, { productId: '', productName: '', qty: 1, unitCost: 0, total: 0 }])
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i))

  const updateItem = (i, field, value) => {
    const updated = [...items]
    updated[i][field] = value
    if (field === 'productId') {
      const prod = products.find((p) => p._id === value)
      updated[i].productName = prod ? prod.name : ''
      updated[i].unitCost = prod ? prod.cost : 0
    }
    if (field === 'qty' || field === 'unitCost') updated[i].total = Number(updated[i].qty) * Number(updated[i].unitCost)
    setItems(updated)
  }

  const subtotal = items.reduce((s, i) => s + Number(i.total), 0)

  const handleCreate = async () => {
    if (!selectedSupplier || !items.some((i) => i.productId)) return addToast('Select supplier and at least one product', 'error')
    const supplier = suppliers.find((s) => s._id === selectedSupplier)
    try {
      await purchaseOrdersApi.create({ supplierId: selectedSupplier, supplierName: supplier?.name || '', items: items.filter((i) => i.productId), subtotal, notes })
      addToast('Purchase order created', 'success')
      setModalOpen(false)
      load()
    } catch (err) { addToast(err.message || 'Failed to create', 'error') }
  }

  const handleStatus = async (id, status) => {
    try {
      await purchaseOrdersApi.updateStatus(id, status)
      addToast(`Order marked as ${status}`, 'success')
      load()
    } catch (err) { addToast(err.message || 'Failed to update', 'error') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this purchase order?')) return
    try { await purchaseOrdersApi.remove(id); addToast('Purchase order deleted', 'success'); load() }
    catch (err) { addToast(err.message || 'Failed to delete', 'error') }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {canWrite && (
          <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ New Purchase Order</button>
        )}
      </div>

      {loading ? <Spinner /> : (
        <>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b">{['Supplier', 'Items', 'Subtotal', 'Status', 'Date', 'Actions'].map((h) => <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>)}</tr></thead>
              <tbody>
                {orders.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-gray-500">No purchase orders</td></tr> :
                  orders.map((o) => (
                    <tr key={o._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{o.supplierName}</td>
                      <td className="px-4 py-3">{o.items.length} item(s)</td>
                      <td className="px-4 py-3">₱{Number(o.subtotal).toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[o.status] || ''}`}>{o.status}</span></td>
                      <td className="px-4 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 flex gap-2">
                        {canExecute && o.status === 'pending' && (
                          <>
                            <button onClick={() => handleStatus(o._id, 'ordered')} className="text-blue-600 hover:underline text-xs">Order</button>
                            <button onClick={() => handleStatus(o._id, 'cancelled')} className="text-red-600 hover:underline text-xs">Cancel</button>
                          </>
                        )}
                        {canExecute && o.status === 'ordered' && (
                          <button onClick={() => handleStatus(o._id, 'received')} className="text-green-600 hover:underline text-xs">Receive</button>
                        )}
                        {canExecute && <button onClick={() => handleDelete(o._id)} className="text-red-600 hover:underline text-xs">Delete</button>}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Purchase Order">
          <div className="space-y-4">
            <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Select Supplier</option>
              {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>

            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Product</label>
                  <select value={item.productId} onChange={(e) => updateItem(i, 'productId', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select Product</option>
                    {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="w-20">
                  <label className="text-xs text-gray-500">Qty</label>
                  <input type="number" min={1} value={item.qty} onChange={(e) => updateItem(i, 'qty', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="w-24">
                  <label className="text-xs text-gray-500">Unit Cost</label>
                  <input type="number" min={0} step="0.01" value={item.unitCost} onChange={(e) => updateItem(i, 'unitCost', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="w-20 pt-5 text-sm font-medium">₱{Number(item.total).toLocaleString()}</div>
                {items.length > 1 && <button onClick={() => removeItem(i)} className="text-red-500 pt-5 text-lg">&times;</button>}
              </div>
            ))}
            <button onClick={addItem} className="text-blue-600 text-sm hover:underline">+ Add Item</button>

            <div className="text-right font-semibold">Subtotal: ₱{subtotal.toLocaleString()}</div>

            <div>
              <label className="text-xs text-gray-500">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
            </div>
          </div>
        </Modal>
    </div>
  )
}

export default PurchaseOrders
