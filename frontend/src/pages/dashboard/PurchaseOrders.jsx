import { useState, useEffect } from 'react'
import { purchaseOrdersApi, suppliersApi, productsApi } from '../../services/api.js'
import Modal from '../../components/Modal.jsx'
import Spinner from '../../components/Spinner.jsx'
import Pagination, { PAGE_SIZE } from '../../components/Pagination.jsx'
import { Button, InputField, Select, Textarea } from '../../components/index.js'
import { useToast } from '../../context/ToastContext.jsx'
import { usePermission } from '../../hooks/usePermission.js'

const statusColors = { pending: 'bg-yellow-100 text-yellow-800', ordered: 'bg-blue-100 text-blue-800', 'partially-received': 'bg-purple-100 text-purple-800', received: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800' }

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
  const [receiveModal, setReceiveModal] = useState(null)
  const [receiveItems, setReceiveItems] = useState([])

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

  const openReceive = (o) => {
    setReceiveModal(o)
    setReceiveItems(o.items.map((item) => ({ productId: item.productId, productName: item.productName, expectedQty: item.qty, receivedQty: item.receivedQty || 0, receiveQty: Math.max(0, item.qty - (item.receivedQty || 0)) })))
  }

  const handleReceive = async () => {
    if (!receiveModal) return
    const items = receiveItems.filter((i) => i.receiveQty > 0)
    if (items.length === 0) return addToast('Enter at least one item quantity', 'error')
    try {
      await purchaseOrdersApi.partialReceive(receiveModal._id, items.map((i) => ({ productId: i.productId, qty: i.receiveQty })))
      addToast('Items received', 'success')
      setReceiveModal(null)
      load()
    } catch (err) { addToast(err.message || 'Failed to receive', 'error') }
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
          <Select name="statusFilter" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="mb-0">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="ordered">Ordered</option>
            <option value="partially-received">Partially Received</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
        {canWrite && (
          <Button variant="primary" onClick={openCreate}>+ New Purchase Order</Button>
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
                      <td className="px-4 py-3">{o.items.length} item(s){o.status === 'partially-received' || o.items.some(i => (i.receivedQty || 0) > 0) ? ` (${o.items.reduce((s, i) => s + (i.receivedQty || 0), 0)}/${o.items.reduce((s, i) => s + i.qty, 0)} received)` : ''}</td>
                      <td className="px-4 py-3">₱{Number(o.subtotal).toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[o.status] || ''}`}>{o.status}</span></td>
                      <td className="px-4 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 flex gap-2">
                        {canExecute && o.status === 'pending' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleStatus(o._id, 'ordered')}>Order</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleStatus(o._id, 'cancelled')}>Cancel</Button>
                          </>
                        )}
                        {(canExecute && (o.status === 'ordered' || o.status === 'partially-received')) && (
                          <Button variant="ghost" size="sm" onClick={() => openReceive(o)}>{o.status === 'partially-received' ? 'Receive More' : 'Receive'}</Button>
                        )}
                        {canExecute && <Button variant="danger" size="sm" onClick={() => handleDelete(o._id)}>Delete</Button>}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={!!receiveModal} onClose={() => setReceiveModal(null)} title={`Receive Items - ${receiveModal?.supplierName || ''}`}>
        <div className="space-y-4">
          {receiveItems.map((item, i) => (
            <div key={i} className="flex gap-2 items-end p-3 bg-gray-50 rounded-lg">
              <div className="flex-1"><p className="text-sm font-medium text-gray-700">{item.productName}</p><p className="text-xs text-gray-500">Ordered: {item.expectedQty} | Already received: {item.receivedQty}</p></div>
              <div className="w-24">
                <InputField label="Receive Qty" name={`receiveQty-${i}`} type="number" min={0} max={item.expectedQty - item.receivedQty} value={item.receiveQty}
                  onChange={(e) => { const updated = [...receiveItems]; updated[i].receiveQty = Math.min(Number(e.target.value), item.expectedQty - item.receivedQty); setReceiveItems(updated) }} />
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setReceiveModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleReceive}>Receive Items</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Purchase Order">
          <div className="space-y-4">
            <Select name="selectedSupplier" value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}>
              <option value="">Select Supplier</option>
              {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </Select>

            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select label="Product" name={`product-${i}`} value={item.productId} onChange={(e) => updateItem(i, 'productId', e.target.value)}>
                    <option value="">Select Product</option>
                    {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </Select>
                </div>
                <div className="w-20">
                  <InputField label="Qty" name={`qty-${i}`} type="number" min={1} value={item.qty} onChange={(e) => updateItem(i, 'qty', e.target.value)} />
                </div>
                <div className="w-24">
                  <InputField label="Unit Cost" name={`unitCost-${i}`} type="number" min={0} step="0.01" value={item.unitCost} onChange={(e) => updateItem(i, 'unitCost', e.target.value)} />
                </div>
                <div className="w-20 pt-5 text-sm font-medium">₱{Number(item.total).toLocaleString()}</div>
                {items.length > 1 && <button onClick={() => removeItem(i)} className="text-red-500 pt-5 text-lg">&times;</button>}
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={addItem}>+ Add Item</Button>

            <div className="text-right font-semibold">Subtotal: ₱{subtotal.toLocaleString()}</div>

            <Textarea label="Notes" name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </Modal>
    </div>
  )
}

export default PurchaseOrders
