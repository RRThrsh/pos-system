import { useState, useEffect } from 'react'
import { suppliersApi, productsApi } from '../../services/api.js'
import Modal from '../../components/Modal.jsx'
import Spinner from '../../components/Spinner.jsx'
import Pagination, { PAGE_SIZE } from '../../components/Pagination.jsx'
import { Button, InputField, Select, Textarea, ConfirmDialog } from '../../components/index.js'
import { useToast } from '../../context/ToastContext.jsx'
import { usePermission } from '../../hooks/usePermission.js'

const emptyForm = { name: '', contact: '', phone: '', email: '', address: '' }

function PriceChange({ previousPrice, currentPrice }) {
  if (previousPrice === undefined || previousPrice === null) return <span className="text-gray-400 text-xs">—</span>
  if (currentPrice > previousPrice) return <span className="text-red-600 font-medium inline-flex items-center gap-0.5">↑ +&#8369;{(currentPrice - previousPrice).toLocaleString()}</span>
  if (currentPrice < previousPrice) return <span className="text-green-600 font-medium inline-flex items-center gap-0.5">↓ -&#8369;{(previousPrice - currentPrice).toLocaleString()}</span>
  return <span className="text-gray-400">→ 0</span>
}

function SupplierProductsModal({ isOpen, onClose, supplier }) {
  const { addToast } = useToast()
  const [products, setProducts] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [priceModal, setPriceModal] = useState(false)
  const [priceForm, setPriceForm] = useState({ productId: '', price: '' })

  const load = async () => {
    if (!supplier) return
    setLoading(true)
    try {
      const [prods, all] = await Promise.all([
        suppliersApi.productsBySupplier(supplier._id || supplier.id),
        productsApi.getAll({ limit: '999' }),
      ])
      setProducts(prods || [])
      setAllProducts((all.data || all.products || all || []).filter((p) => !(prods || []).find((sp) => sp.productId === p._id)))
    } catch (err) {
      addToast(err.message || 'Failed to load products', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (isOpen) load() }, [isOpen])

  const handleSetPrice = async (e) => {
    e.preventDefault()
    try {
      await suppliersApi.setProductPrice({
        supplierId: supplier._id || supplier.id,
        productId: priceForm.productId,
        price: Number(priceForm.price),
      })
      addToast('Price set', 'success')
      setPriceModal(false)
      setPriceForm({ productId: '', price: '' })
      load()
    } catch (err) {
      addToast(err.message || 'Failed to set price', 'error')
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Products - ${supplier?.name || ''}`} size="lg">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">{products.length} product(s)</p>
          <Button variant="primary" size="sm" onClick={() => setPriceModal(true)}>+ Add Product</Button>
        </div>
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Product</th>
                  <th className="text-left px-3 py-2 font-medium">SKU</th>
                  <th className="text-right px-3 py-2 font-medium">Price</th>
                  <th className="text-right px-3 py-2 font-medium">Change</th>
                  <th className="text-right px-3 py-2 font-medium">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">No products assigned to this supplier.</td></tr>
                ) : (
                  products.map((sp) => (
                    <tr key={sp._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">{sp.productName}</td>
                      <td className="px-3 py-2 text-gray-500">{sp.productSku}</td>
                      <td className="px-3 py-2 text-right font-medium">&#8369;{Number(sp.price).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right"><PriceChange previousPrice={sp.previousPrice} currentPrice={sp.price} /></td>
                      <td className="px-3 py-2 text-right text-gray-500 text-xs">{new Date(sp.updatedAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <Modal isOpen={priceModal} onClose={() => setPriceModal(false)} title="Add Product Price">
        <form onSubmit={handleSetPrice} className="space-y-3">
          <Select label="Product" name="productId" required value={priceForm.productId} onChange={(e) => setPriceForm({ ...priceForm, productId: e.target.value })}>
            <option value="">Select product...</option>
            {allProducts.map((p) => (
              <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
            ))}
          </Select>
          <InputField label="Price" name="price" type="number" required min="0" step="0.01" value={priceForm.price}
            onChange={(e) => setPriceForm({ ...priceForm, price: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setPriceModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Set Price</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function CompareModal({ isOpen, onClose }) {
  const { addToast } = useToast()
  const [allProducts, setAllProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [comparison, setComparison] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      productsApi.getAll({ limit: '999' })
        .then((res) => setAllProducts(res.data || res.products || res || []))
        .catch(() => {})
    }
  }, [isOpen])

  const handleCompare = async () => {
    if (!selectedProduct) return
    setLoading(true)
    try {
      const res = await suppliersApi.compareByProduct({ productId: selectedProduct })
      setComparison((res || []).sort((a, b) => a.price - b.price))
    } catch (err) {
      addToast(err.message || 'Failed to compare', 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectedName = allProducts.find((p) => p._id === selectedProduct)?.name || ''

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compare Supplier Prices" size="lg">
      <div className="flex gap-3 mb-4">
        <Select name="compareProduct" value={selectedProduct} onChange={(e) => { setSelectedProduct(e.target.value); setComparison([]) }}
          className="flex-1 mb-0">
          <option value="">Select a product...</option>
          {allProducts.map((p) => (
            <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
          ))}
        </Select>
        <Button variant="primary" onClick={handleCompare} disabled={!selectedProduct}>Compare</Button>
      </div>

      {loading ? <Spinner /> : comparison.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-2">
            Prices for: <span className="font-semibold text-gray-900">{selectedName}</span>
            &nbsp;&mdash;&nbsp;Lowest: &#8369;{Number(comparison[0].price).toLocaleString()}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Supplier</th>
                  <th className="text-right px-3 py-2 font-medium">Price</th>
                  <th className="text-right px-3 py-2 font-medium">vs Lowest</th>
                  <th className="text-right px-3 py-2 font-medium">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparison.map((cp) => {
                  const diff = cp.price - comparison[0].price
                  return (
                    <tr key={cp._id} className={`hover:bg-gray-50 ${cp.price === comparison[0].price ? 'bg-green-50' : ''}`}>
                      <td className="px-3 py-2 font-medium text-gray-900">{cp.supplierName}</td>
                      <td className="px-3 py-2 text-right font-medium">&#8369;{Number(cp.price).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">
                        {diff === 0 ? (
                          <span className="text-green-600 text-xs font-medium">Best Price</span>
                        ) : (
                          <span className="text-red-500 text-xs">+&#8369;{diff.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-500 text-xs">{new Date(cp.updatedAt).toLocaleDateString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  )
}

function Suppliers() {
  const { addToast } = useToast()
  const { canWrite, canExecute } = usePermission('Suppliers')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [productModal, setProductModal] = useState(false)
  const [compareModal, setCompareModal] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedSupplier, setSelectedSupplier] = useState(null)

  const load = () => {
    setLoading(true)
    suppliersApi.getAll({ search, limit: '100' })
      .then((res) => setItems(res.data || res.suppliers || res || []))
      .catch((err) => addToast(err.message || 'Failed to load', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1); load() }, [search])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (item) => {
    setEditing(item)
    setForm({ name: item.name || '', contact: item.contact || '', phone: item.phone || '', email: item.email || '', address: item.address || '' })
    setModalOpen(true)
  }

  const openProducts = (item) => {
    setSelectedSupplier(item)
    setProductModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await suppliersApi.update(editing._id || editing.id, form)
        addToast('Supplier updated', 'success')
      } else {
        await suppliersApi.create(form)
        addToast('Supplier created', 'success')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      addToast(err.message || 'Save failed', 'error')
    }
  }

  const handleDelete = async (id) => {
    try {
      await suppliersApi.remove(id)
      addToast('Supplier deleted', 'success')
      load()
    } catch (err) {
      addToast(err.message || 'Delete failed', 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <InputField name="search" placeholder="Search suppliers..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs mb-0" />
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setCompareModal(true)}>Compare Prices</Button>
          {canWrite && <Button variant="primary" onClick={openCreate}>+ Add Supplier</Button>}
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Contact</th>
                <th className="text-left px-4 py-3 font-medium">Phone</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Address</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item) => (
                <tr key={item._id || item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.contact}</td>
                  <td className="px-4 py-3 text-gray-600">{item.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{item.email}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{item.address}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {canWrite && <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Edit</Button>}
                      <Button variant="ghost" size="sm" onClick={() => openProducts(item)}>Products</Button>
                      {canExecute && <Button variant="danger" size="sm" onClick={() => { setDeleteTarget(item._id || item.id); setDeleteConfirmOpen(true) }}>Delete</Button>}
                    </div>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No suppliers found.</td></tr>
              )}
            </tbody>
          </table>
          <Pagination items={items} currentPage={page} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'}>
        <form onSubmit={handleSave} className="space-y-3">
          <InputField label="Name" name="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <InputField label="Contact Person" name="contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Phone" name="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <InputField label="Email" name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <Textarea label="Address" name="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <SupplierProductsModal isOpen={productModal} onClose={() => { setProductModal(false); setSelectedSupplier(null) }} supplier={selectedSupplier} />
      <CompareModal isOpen={compareModal} onClose={() => setCompareModal(false)} />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setDeleteTarget(null) }}
        onConfirm={() => { handleDelete(deleteTarget); setDeleteConfirmOpen(false); setDeleteTarget(null) }}
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  )
}

export default Suppliers
