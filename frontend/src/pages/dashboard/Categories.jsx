import { useState, useEffect } from 'react'
import { categoriesApi } from '../../services/api.js'
import Modal from '../../components/Modal.jsx'
import Spinner from '../../components/Spinner.jsx'
import Pagination, { PAGE_SIZE } from '../../components/Pagination.jsx'
import { Button, InputField } from '../../components/index.js'
import { useToast } from '../../context/ToastContext.jsx'
import { usePermission } from '../../hooks/usePermission.js'

function Categories() {
  const { addToast } = useToast()
  const { canWrite, canExecute } = usePermission('Categories')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [page, setPage] = useState(1)

  const load = () => {
    setLoading(true)
    categoriesApi.getAll()
      .then((res) => setItems(res.categories || res.data || res || []))
      .catch((err) => addToast(err.message || 'Failed to load', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setName(''); setModalOpen(true) }
  const openEdit = (item) => { setEditing(item); setName(item.name); setModalOpen(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      if (editing) {
        await categoriesApi.update(editing._id || editing.id, { name: name.trim() })
        addToast('Category updated', 'success')
      } else {
        await categoriesApi.create({ name: name.trim() })
        addToast('Category created', 'success')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      addToast(err.message || 'Save failed', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return
    try {
      await categoriesApi.remove(id)
      addToast('Category deleted', 'success')
      load()
    } catch (err) {
      addToast(err.message || 'Delete failed', 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-6">
        {canWrite && <Button variant="primary" onClick={openCreate}>+ Add Category</Button>}
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item) => (
                <tr key={item._id || item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-center">
                    {canWrite && <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Edit</Button>}
                    {canExecute && <Button variant="danger" size="sm" onClick={() => handleDelete(item._id || item.id)}>Delete</Button>}
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr><td colSpan={2} className="text-center py-8 text-gray-400">No categories found.</td></tr>
              )}
            </tbody>
          </table>
          <Pagination items={items} currentPage={page} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSave} className="space-y-3">
          <InputField label="Name" name="name" required value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Categories
