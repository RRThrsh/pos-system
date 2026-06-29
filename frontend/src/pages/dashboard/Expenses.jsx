import { useState, useEffect } from 'react'
import { expensesApi, paymentMethodsApi } from '../../services/api.js'
import Modal from '../../components/Modal.jsx'
import Spinner from '../../components/Spinner.jsx'
import Pagination, { PAGE_SIZE } from '../../components/Pagination.jsx'
import { Button, InputField, Select, ConfirmDialog } from '../../components/index.js'
import { useToast } from '../../context/ToastContext.jsx'
import { usePermission } from '../../hooks/usePermission.js'

const expenseCategories = ['Utilities', 'Rent', 'Supplies', 'Maintenance', 'Salaries', 'Marketing', 'Transportation', 'Food', 'Other']
const fallbackPaymentMethods = ['Cash', 'GCash', 'Bank Transfer', 'Credit Card', 'Other']

function Expenses() {
  const { addToast } = useToast()
  const { canWrite, canExecute } = usePermission('Expenses')
  const [expenses, setExpenses] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [paymentMethods, setPaymentMethods] = useState(fallbackPaymentMethods)
  const [form, setForm] = useState({ description: '', amount: '', category: expenseCategories[0], paymentMethod: fallbackPaymentMethods[0], reference: '' })
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => {
    setLoading(true)
    expensesApi.getAll({ category: categoryFilter, page, limit: PAGE_SIZE })
      .then((res) => { setExpenses(res.data || []); setTotal(res.total || 0) })
      .catch((err) => addToast(err.message || 'Failed to load', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    paymentMethodsApi.getAll().then((res) => {
      const methods = Array.isArray(res) ? res.filter((m) => m.isActive !== false).map((m) => m.name) : []
      if (methods.length) {
        setPaymentMethods(methods)
        setForm((prev) => ({ ...prev, paymentMethod: methods[0] }))
      }
    }).catch(() => {})
  }, [])

  useEffect(() => { load() }, [page, categoryFilter])

  const handleCreate = async () => {
    if (!form.description || !form.amount) return addToast('Description and amount are required', 'error')
    try {
      await expensesApi.create({ ...form, amount: Number(form.amount) })
      addToast('Expense added', 'success')
      setModalOpen(false)
      setForm({ description: '', amount: '', category: expenseCategories[0], paymentMethod: paymentMethods[0] || fallbackPaymentMethods[0], reference: '' })
      load()
    } catch (err) { addToast(err.message || 'Failed to create', 'error') }
  }

  const handleDelete = async (id) => {
    try { await expensesApi.remove(id); addToast('Expense deleted', 'success'); load() }
    catch (err) { addToast(err.message || 'Failed to delete', 'error') }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Select name="categoryFilter" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }} className="mb-0">
          <option value="">All Categories</option>
          {expenseCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        {canWrite && (
          <Button variant="primary" onClick={() => setModalOpen(true)}>+ Add Expense</Button>
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
                      <td className="px-4 py-3">{canExecute && <Button variant="danger" size="sm" onClick={() => { setDeleteTarget(e._id); setDeleteConfirmOpen(true) }}>Delete</Button>}</td>
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
            <InputField name="description" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <InputField name="amount" type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Select name="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {expenseCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select name="paymentMethod" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
            <InputField name="reference" placeholder="Reference (optional)" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate}>Save</Button>
            </div>
          </div>
        </Modal>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setDeleteTarget(null) }}
        onConfirm={() => { handleDelete(deleteTarget); setDeleteConfirmOpen(false); setDeleteTarget(null) }}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  )
}

export default Expenses
