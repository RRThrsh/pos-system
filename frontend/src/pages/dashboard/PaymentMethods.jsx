import { useState, useEffect } from 'react'
import { paymentMethodsApi } from '../../services/api.js'
import Modal from '../../components/Modal.jsx'
import Spinner from '../../components/Spinner.jsx'
import Pagination, { PAGE_SIZE } from '../../components/Pagination.jsx'
import { Button, InputField, ConfirmDialog } from '../../components/index.js'
import { useToast } from '../../context/ToastContext.jsx'
import { usePermission } from '../../hooks/usePermission.js'

function PaymentMethods() {
  const { addToast } = useToast()
  const { canWrite, canExecute } = usePermission('Payment Methods')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [page, setPage] = useState(1)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => {
    setLoading(true)
    paymentMethodsApi.getAll()
      .then((res) => setItems(res || []))
      .catch((err) => addToast(err.message || 'Failed to load', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setName(''); setDescription(''); setIsActive(true); setModalOpen(true) }
  const openEdit = (item) => { setEditing(item); setName(item.name); setDescription(item.description || ''); setIsActive(item.isActive !== false); setModalOpen(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      if (editing) {
        await paymentMethodsApi.update(editing._id || editing.id, { name: name.trim(), description: description.trim(), isActive })
        addToast('Payment method updated', 'success')
      } else {
        await paymentMethodsApi.create({ name: name.trim(), description: description.trim(), isActive })
        addToast('Payment method created', 'success')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      addToast(err.message || 'Save failed', 'error')
    }
  }

  const handleDelete = async (id) => {
    try {
      await paymentMethodsApi.remove(id)
      addToast('Payment method deleted', 'success')
      load()
    } catch (err) {
      addToast(err.message || 'Delete failed', 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-6">
        {canWrite && <Button variant="primary" onClick={openCreate}>+ Add Payment Method</Button>}
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item) => (
                <tr key={item._id || item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.description || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {canWrite && <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Edit</Button>}
                    {canExecute && <Button variant="danger" size="sm" onClick={() => { setDeleteTarget(item._id || item.id); setDeleteConfirmOpen(true) }}>Delete</Button>}
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">No payment methods found.</td></tr>
              )}
            </tbody>
          </table>
          <Pagination items={items} currentPage={page} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Payment Method' : 'Add Payment Method'}>
        <form onSubmit={handleSave} className="space-y-3">
          <InputField label="Name" name="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cash, GCash, Card" />
          <InputField label="Description (optional)" name="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setDeleteTarget(null) }}
        onConfirm={() => { handleDelete(deleteTarget); setDeleteConfirmOpen(false); setDeleteTarget(null) }}
        title="Delete Payment Method"
        message="Are you sure you want to delete this payment method? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  )
}

export default PaymentMethods
