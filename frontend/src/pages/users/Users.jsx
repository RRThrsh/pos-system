import { useState, useEffect } from 'react'
import { usersApi } from '../../services/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import Button from '../../components/Button.jsx'
import Modal from '../../components/Modal.jsx'
import InputField from '../../components/InputField.jsx'
import Spinner from '../../components/Spinner.jsx'

const roles = ['superadmin', 'admin', 'cashier']

function Users() {
  const { addToast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ firstName: '', lastName: '', username: '', password: '', role: 'cashier' })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchUsers = async () => {
    try {
      const data = await usersApi.getAll()
      setUsers(data)
    } catch {
      addToast('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ firstName: '', lastName: '', username: '', password: '', role: 'cashier' })
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (user) => {
    setEditing(user)
    setForm({ firstName: user.firstName, lastName: user.lastName, username: user.username, password: '', role: user.role })
    setFormError('')
    setModalOpen(true)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)

    try {
      if (editing) {
        const payload = { firstName: form.firstName, lastName: form.lastName, role: form.role }
        if (form.password) payload.password = form.password
        await usersApi.update(editing.id, payload)
        addToast('User updated', 'success')
      } else {
        if (!form.password) {
          setFormError('Password is required')
          setSaving(false)
          return
        }
        await usersApi.create(form)
        addToast('User created', 'success')
      }
      setModalOpen(false)
      fetchUsers()
    } catch (err) {
      setFormError(err.message || 'Operation failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await usersApi.remove(id)
      addToast('User deleted', 'success')
      fetchUsers()
    } catch {
      addToast('Failed to delete user', 'error')
    }
  }

  const handleToggleActive = async (user) => {
    try {
      await usersApi.update(user.id, { isActive: !user.isActive })
      addToast(`User ${user.isActive ? 'deactivated' : 'activated'}`, 'success')
      fetchUsers()
    } catch {
      addToast('Failed to update user', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Users</h1>
        <Button onClick={openCreate}>+ Add User</Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-xs">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Username</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id || user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{user.firstName} {user.lastName}</td>
                  <td className="px-4 py-3 text-gray-600">{user.username}</td>
                  <td className="px-4 py-3 capitalize">{user.role}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isActive === false ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {user.isActive === false ? 'Inactive' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(user)}>
                      {user.isActive === false ? 'Activate' : 'Deactivate'}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(user._id || user.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">{formError}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <InputField label="First Name" name="firstName" value={form.firstName} onChange={handleChange} required />
            <InputField label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} required />
          </div>
          <InputField label="Username" name="username" value={form.username} onChange={handleChange} required disabled={!!editing} />
          <InputField label={editing ? 'Password (leave blank to keep)' : 'Password'} name="password" type="password" value={form.password} onChange={handleChange} required={!editing} />
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-1">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {roles.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Users
