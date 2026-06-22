import { useState, useEffect } from 'react'
import { expensesApi } from '../../services/api.js'
import Modal from '../../components/Modal.jsx'
import Spinner from '../../components/Spinner.jsx'
import Pagination, { PAGE_SIZE } from '../../components/Pagination.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { usePermission } from '../../hooks/usePermission.js'

const expenseCategories = ['Utilities', 'Rent', 'Supplies', 'Maintenance', 'Salaries', 'Marketing', 'Transportation', 'Food', 'Other']
const paymentMethods = ['Cash', 'GCash', 'Bank Transfer', 'Credit Card', 'Other']

function Expenses() {
  const { addToast } = useToast()
  const { canWrite, canExecute } = usePermission('Expenses')
  const [expenses, setExpenses] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [form, setForm] = useState({ description: '', amount: '', category: expenseCategories[0], paymentMethod: paymentMethods[0], reference: '' })

  const load = () => {
    setLoading(true)
    expensesApi.getAll({ category: categoryFilter, page, limit: PAGE_SIZE })
      .then((res) => { setExpenses(res.data || []); setTotal(res.total || 0) })
      .catch((err) => addToast(err.message || 'Failed to load', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, categoryFilter])

  const handleCreate = async () => {
    if (!form.description || !form.amount) return addToast('Description and amount are required', 'error')
    try {
      await expensesApi.create({ ...form, amount: Number(form.amount) })
      addToast('Expense added', 'success')
      setModalOpen(false)
      setForm({ description: '', amount: '', category: expenseCategories[0], paymentMethod: paymentMethods[0], reference: '' })
      load()
    } catch (err) { addToast(err.message || 'Failed to create', 'error') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    try { await expensesApi.remove(id); addToast('Expense deleted', 'success'); load() }
    catch (err) { addToast(err.message || 'Failed to delete', 'error') }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {expenseCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {canWrite && (
          <button onClick={() => setModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Add Expense</button>
        )}
      </div>

      {loading ? <Spinner /> : (
        <>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b">{['Description', 'Amount', 'Category', 'Payment', 'Reference', 'Date', 'Actions'].map((h) => <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>)}</tr></thead>
              <tbody>
                {expenses.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-gray-500">No expenses</td></tr> :
                  expenses.map((e) => (
                    <tr key={e._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{e.description}</td>
                      <td className="px-4 py-3 font-medium">₱{Number(e.amount).toLocaleString()}</td>
                      <td className="px-4 py-3">{e.category}</td>
                      <td className="px-4 py-3">{e.paymentMethod}</td>
                      <td className="px-4 py-3 text-gray-500">{e.reference || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(e.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{canExecute && <button onClick={() => handleDelete(e._id)} className="text-red-600 hover:underline text-xs">Delete</button>}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Expense">
          <div className="space-y-4">
            <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
              {expenseCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
              {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <input placeholder="Reference (optional)" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </div>
        </Modal>
    </div>
  )
}

export default Expenses
