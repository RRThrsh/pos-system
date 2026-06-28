import { useState, useEffect } from 'react'
import { usersApi } from '../../services/api.js'
import Modal from '../../components/Modal.jsx'
import Spinner from '../../components/Spinner.jsx'
import Pagination, { PAGE_SIZE } from '../../components/Pagination.jsx'
import { Button, InputField, Select } from '../../components/index.js'
import { useToast } from '../../context/ToastContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

const emptyForm = { firstName: '', lastName: '', username: '', password: '', role: 'cashier' }

function Users() {
  const { addToast } = useToast()
  const { user: currentUser } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [page, setPage] = useState(1)

  const load = () => {
    setLoading(true)
    usersApi.getAll()
      .then((res) => setItems(res.users || res.data || res || []))
      .catch((err) => addToast(err.message || 'Failed to load', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }

  const isSelf = (item) => item._id === currentUser?.id

  const openEdit = (item) => {
    if (currentUser?.role !== 'superadmin' && item.role === 'superadmin') {
      addToast('You cannot edit a superadmin account.', 'error')
      return
    }
    setEditing(item)
    setForm({
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      username: item.username || '',
      password: '',
      currentPassword: '',
      role: item.role || 'cashier',
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const trimmed = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      username: form.username.trim(),
    }
    if (!trimmed.firstName || !trimmed.lastName || !trimmed.username) {
      addToast('First name, last name, and username cannot be blank.', 'error')
      return
    }
    if (!editing && !form.password.trim()) {
      addToast('Password is required.', 'error')
      return
    }
    if (editing && isSelf(editing) && form.password && !form.currentPassword) {
      addToast('Current password is required to set a new password.', 'error')
      return
    }
    try {
      const payload = { ...form, ...trimmed }
      if (editing && !payload.password) { delete payload.password; delete payload.currentPassword }
      if (editing && payload.password && !isSelf(editing)) delete payload.currentPassword
      if (editing) {
        await usersApi.update(editing._id || editing.id, payload)
        addToast('User updated', 'success')
      } else {
        await usersApi.create(payload)
        addToast('User created', 'success')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      addToast(err.message || 'Save failed', 'error')
    }
  }

  const superadminCount = items.filter((u) => u.role === 'superadmin').length

  const handleDelete = async (id, item) => {
    if (item._id === currentUser?.id) {
      addToast('You cannot delete your own account.', 'error')
      return
    }
    if (currentUser?.role !== 'superadmin' && item.role === 'superadmin') {
      addToast('You cannot delete a superadmin account.', 'error')
      return
    }
    if (item.role === 'superadmin' && superadminCount <= 1) {
      addToast('Cannot delete the only superadmin.', 'error')
      return
    }
    if (!confirm('Delete this user?')) return
    try {
      await usersApi.remove(id)
      addToast('User deleted', 'success')
      load()
    } catch (err) {
      addToast(err.message || 'Delete failed', 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-6">
        <Button variant="primary" onClick={openCreate}>+ Add User</Button>
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Username</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item) => (
                <tr key={item._id || item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.firstName} {item.lastName}</td>
                  <td className="px-4 py-3 text-gray-600">{item.username}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{item.role}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
                      <div className="flex items-center justify-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                          <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                          Edit
                        </Button>
                        {(() => {
                          const isSelf = item._id === currentUser?.id
                          const isLastSuperadmin = item.role === 'superadmin' && superadminCount <= 1
                          const disabled = isSelf || isLastSuperadmin
                          return (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => !disabled && handleDelete(item._id || item.id, item)}
                              className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
                              title={isSelf ? 'Cannot delete your own account' : isLastSuperadmin ? 'Cannot delete the only superadmin' : 'Delete user'}
                              disabled={disabled}
                            >
                              <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                              Delete
                            </Button>
                          )
                        })()}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No users found.</td></tr>
              )}
            </tbody>
          </table>
          <Pagination items={items} currentPage={page} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <InputField label="First Name" name="firstName" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <InputField label="Last Name" name="lastName" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <InputField label="Username" name="username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <InputField label={editing ? 'New Password (leave blank to keep)' : 'Password'} name="password" type="password" required={!editing} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {editing && isSelf(editing) && form.password && (
            <InputField label="Current Password" name="currentPassword" type="password" required value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            {editing && editing._id === currentUser?.id ? (
              <input type="text" value={form.role} disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 capitalize cursor-not-allowed" />
            ) : (
              <Select name="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="cashier">Cashier</option>
                <option value="admin">Admin</option>
                {(currentUser?.role === 'superadmin') && <option value="superadmin">Superadmin</option>}
              </Select>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Users
