import { useState, useEffect, useCallback } from 'react'
import { customersApi } from '../../services/api.js'
import Spinner from '../../components/Spinner.jsx'
import { useToast } from '../../context/ToastContext.jsx'

function Customers() {
  const { addToast } = useToast()
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' })

  const fetchCustomers = useCallback(async (q) => {
    setLoading(true)
    try {
      const data = q ? await customersApi.search(q) : await customersApi.getAll()
      setCustomers(data)
    } catch (err) {
      addToast(err.message || 'Failed to load customers', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { fetchCustomers(search) }, [fetchCustomers, search])

  const handleSave = async () => {
    if (!form.name.trim()) { addToast('Name is required', 'error'); return }
    try {
      if (editing) {
        const updated = await customersApi.update(editing, form)
        setCustomers(customers.map(c => c._id === editing ? updated : c))
        addToast('Customer updated', 'success')
      } else {
        const created = await customersApi.create(form)
        setCustomers([created, ...customers])
        addToast('Customer created', 'success')
      }
      setShowModal(false); setEditing(null); setForm({ name: '', phone: '', email: '', address: '' })
    } catch (err) {
      addToast(err.message || 'Failed to save customer', 'error')
    }
  }

  const handleEdit = (c) => {
    setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '' })
    setEditing(c._id)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return
    try {
      await customersApi.remove(id)
      setCustomers(customers.filter(c => c._id !== id))
      addToast('Customer deleted', 'success')
    } catch (err) {
      addToast(err.message || 'Failed to delete customer', 'error')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customers</h1>
        <input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)}
          className="max-w-xs w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button onClick={() => { setEditing(null); setForm({ name: '', phone: '', email: '', address: '' }); setShowModal(true) }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          + Add Customer
        </button>
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr><th className="text-left px-4 py-3 font-medium">Name</th><th className="text-left px-4 py-3 font-medium">Phone</th><th className="text-left px-4 py-3 font-medium">Email</th><th className="text-right px-4 py-3 font-medium">Total Spent</th><th className="text-center px-4 py-3 font-medium">Points</th><th className="text-center px-4 py-3 font-medium">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">No customers found.</td></tr> :
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-gray-500">{c.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{c.email || '-'}</td>
                    <td className="px-4 py-3 text-right">&#8369;{Number(c.totalSpent || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">{c.loyaltyPoints || 0}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(c)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Edit</button>
                        <button onClick={() => handleDelete(c._id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editing ? 'Edit Customer' : 'Add Customer'}</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers
