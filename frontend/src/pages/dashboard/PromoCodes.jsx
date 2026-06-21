import { useState, useEffect } from 'react'
import { promoCodesApi } from '../../services/api.js'
import Modal from '../../components/Modal.jsx'
import Spinner from '../../components/Spinner.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { usePermission } from '../../hooks/usePermission.js'

function PromoCodes() {
  const { addToast } = useToast()
  const { canWrite, canExecute } = usePermission('Promo Codes')
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ code: '', discountType: 'percentage', discountValue: '', minPurchase: '', maxUses: '', expiresAt: '' })

  const load = () => {
    setLoading(true)
    promoCodesApi.getAll()
      .then((res) => setCodes(Array.isArray(res) ? res : []))
      .catch((err) => addToast(err.message || 'Failed to load', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.code || !form.discountValue) return addToast('Code and discount value are required', 'error')
    try {
      await promoCodesApi.create({
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minPurchase: form.minPurchase || undefined,
        maxUses: form.maxUses || undefined,
        expiresAt: form.expiresAt || undefined,
      })
      addToast('Promo code created', 'success')
      setModalOpen(false)
      setForm({ code: '', discountType: 'percentage', discountValue: '', minPurchase: '', maxUses: '', expiresAt: '' })
      load()
    } catch (err) { addToast(err.message || 'Failed to create', 'error') }
  }

  const handleToggle = async (id, isActive) => {
    try { await promoCodesApi.toggleActive(id, isActive); addToast(`Code ${isActive ? 'activated' : 'deactivated'}`, 'success'); load() }
    catch (err) { addToast(err.message || 'Failed to toggle', 'error') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this promo code?')) return
    try { await promoCodesApi.remove(id); addToast('Promo code deleted', 'success'); load() }
    catch (err) { addToast(err.message || 'Failed to delete', 'error') }
  }

  const isValid = (c) => {
    if (!c.isActive) return false
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) return false
    if (c.maxUses && c.useCount >= c.maxUses) return false
    return true
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm text-gray-500">{codes.filter(isValid).length} active of {codes.length} total</h2>
        {canWrite && (
          <button onClick={() => setModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ New Promo Code</button>
        )}
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b">{['Code', 'Discount', 'Min Purchase', 'Uses', 'Expires', 'Status', 'Actions'].map((h) => <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>)}</tr></thead>
            <tbody>
              {codes.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-gray-500">No promo codes</td></tr> :
                codes.map((c) => (
                  <tr key={c._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                    <td className="px-4 py-3">{c.discountType === 'percentage' ? `${c.discountValue}%` : `₱${Number(c.discountValue).toLocaleString()}`}</td>
                    <td className="px-4 py-3">{c.minPurchase ? `₱${Number(c.minPurchase).toLocaleString()}` : '-'}</td>
                    <td className="px-4 py-3">{c.useCount}{c.maxUses ? `/${c.maxUses}` : ''}</td>
                    <td className="px-4 py-3">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isValid(c) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {isValid(c) ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      {canExecute && (
                        <button onClick={() => handleToggle(c._id, !c.isActive)} className="text-blue-600 hover:underline text-xs">
                          {c.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                      {canExecute && <button onClick={() => handleDelete(c._id)} className="text-red-600 hover:underline text-xs">Delete</button>}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Promo Code">
          <div className="space-y-4">
            <input placeholder="Code (e.g. SAVE20)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full border rounded-lg px-3 py-2 text-sm font-mono uppercase" />
            <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₱)</option>
            </select>
            <input type="number" min={0} step="0.01" placeholder={form.discountType === 'percentage' ? 'Discount %' : 'Discount Amount'} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input type="number" min={0} placeholder="Min Purchase (optional)" value={form.minPurchase} onChange={(e) => setForm({ ...form, minPurchase: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input type="number" min={1} placeholder="Max Uses (optional)" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div>
              <label className="text-xs text-gray-500">Expires At (optional)</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
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

export default PromoCodes
