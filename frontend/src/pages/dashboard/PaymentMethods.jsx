import { useState, useEffect } from 'react'
import { paymentMethodsApi } from '../../services/api.js'
import Spinner from '../../components/Spinner.jsx'
import { Button, ConfirmDialog } from '../../components/index.js'
import { useToast } from '../../context/ToastContext.jsx'
import { usePermission } from '../../hooks/usePermission.js'

const ICON_SVG = {
  cash: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
  card: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>,
  gcash: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>,
  maya: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" /></svg>,
  bank: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" /></svg>,
  wallet: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" /></svg>,
  other: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
}

const ICONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'gcash', label: 'GCash' },
  { value: 'maya', label: 'Maya' },
  { value: 'bank', label: 'Bank' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'other', label: 'Other' },
]

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select' },
]

const PROVIDERS = [
  { value: '', label: 'None (manual only)', color: 'gray' },
  { value: 'stripe', label: 'Stripe', color: 'purple' },
  { value: 'paymongo', label: 'PayMongo', color: 'blue' },
]

const PROVIDER_COLORS = {
  stripe: 'bg-purple-100 text-purple-700',
  paymongo: 'bg-blue-100 text-blue-700',
}

function emptyField() {
  return { label: '', key: '', type: 'text', required: false, placeholder: '', options: [], maxLength: null }
}

function emptyForm() {
  return { name: '', description: '', isActive: true, icon: 'other', fields: [], provider: '', apiKey: '', publicKey: '', mode: 'sandbox' }
}

function FormInput({ label, type = 'text', value, onChange, placeholder, required, className = '', children }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      {type === 'select' ? (
        <select value={value} onChange={onChange} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none bg-white">
          {placeholder && <option value="">{placeholder}</option>}
          {children}
        </select>
      ) : (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none placeholder:text-gray-300" />
      )}
    </div>
  )
}

function Section({ title, badge, children }) {
  return (
    <div className="border border-gray-100 rounded-xl bg-white">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/80 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
        {badge && <span className="text-[10px] font-medium text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">{badge}</span>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function PaymentMethods() {
  const { addToast } = useToast()
  const { canWrite, canExecute } = usePermission('Payment Methods')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showKeys, setShowKeys] = useState(false)

  const load = () => {
    setLoading(true)
    paymentMethodsApi.getAll()
      .then((res) => setItems(res || []))
      .catch((err) => addToast(err.message || 'Failed to load', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const resetForm = () => { setForm(emptyForm()); setEditingId(null); setShowKeys(false) }

  const startEdit = (item) => {
    setEditingId(item._id || item.id)
    setForm({
      name: item.name || '',
      description: item.description || '',
      isActive: item.isActive !== false,
      icon: item.icon || 'other',
      fields: item.fields || [],
      provider: item.provider || '',
      apiKey: item.apiKey && item.apiKey.startsWith('sk_••••') ? '' : (item.apiKey || ''),
      publicKey: item.publicKey || '',
      mode: item.mode || 'sandbox',
    })
    setShowKeys(false)
  }

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const updateField = (i, patch) => {
    setForm((prev) => ({ ...prev, fields: prev.fields.map((f, idx) => idx === i ? { ...f, ...patch } : f) }))
  }

  const removeField = (i) => {
    setForm((prev) => ({ ...prev, fields: prev.fields.filter((_, idx) => idx !== i) }))
  }

  const addField = () => {
    setForm((prev) => ({ ...prev, fields: [...prev.fields, emptyField()] }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return addToast('Payment method name is required', 'error')
    setSaving(true)
    const cleaned = form.fields.map((f) => ({
      ...f,
      options: f.type === 'select' ? (f.options || []).filter(Boolean) : undefined,
      maxLength: f.type === 'text' && f.maxLength ? Number(f.maxLength) : undefined,
      placeholder: f.placeholder || undefined,
    })).filter((f) => f.label && f.key)
    try {
      const payload = {
        name: form.name.trim(), description: form.description.trim(), isActive: form.isActive,
        icon: form.icon, fields: cleaned, provider: form.provider || undefined,
        apiKey: form.apiKey || undefined, publicKey: form.publicKey || undefined, mode: form.mode || 'sandbox',
      }
      if (editingId) {
        await paymentMethodsApi.update(editingId, payload)
        addToast('Payment method updated', 'success')
      } else {
        await paymentMethodsApi.create(payload)
        addToast('Payment method created', 'success')
      }
      resetForm(); load()
    } catch (err) {
      addToast(err.message || 'Save failed', 'error')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await paymentMethodsApi.remove(id)
      addToast('Payment method deleted', 'success')
      if (editingId === id) resetForm()
      load()
    } catch (err) { addToast(err.message || 'Delete failed', 'error') }
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      <div className="w-full xl:w-[520px] shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Payment Method' : 'New Payment Method'}</h2>
          {editingId && (
            <button onClick={resetForm} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <Section title="Basic Information">
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-3">
                <FormInput label="Name" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Cash, GCash, Card" />
              </div>
              <div className="col-span-2">
                <FormInput label="Icon" type="select" value={form.icon} onChange={(e) => set('icon', e.target.value)}>
                  {ICONS.map((ic) => <option key={ic.value} value={ic.value}>{ic.label}</option>)}
                </FormInput>
              </div>
            </div>
            <div className="mt-3">
              <FormInput label="Description (optional)" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Brief description of this payment method" />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button type="button" onClick={() => set('isActive', !form.isActive)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${form.isActive ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                <span className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200" style={{ transform: form.isActive ? 'translateX(18px)' : 'translateX(3px)' }} />
              </button>
              <span className="text-sm text-gray-600">{form.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </Section>

          <Section title="Payment Gateway" badge={form.provider ? form.provider : 'manual'}>
            <div className="grid grid-cols-2 gap-3">
              <FormInput label="Provider" type="select" value={form.provider} onChange={(e) => { set('provider', e.target.value); setShowKeys(false) }}>
                {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </FormInput>
              <FormInput label="Mode" type="select" value={form.mode} onChange={(e) => set('mode', e.target.value)}>
                <option value="sandbox">Sandbox (Test)</option>
                <option value="live">Live</option>
              </FormInput>
            </div>
            {form.provider && (
              <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Secret Key</label>
                  <div className="relative">
                    <input type={showKeys ? 'text' : 'password'} value={form.apiKey} onChange={(e) => set('apiKey', e.target.value)} placeholder={form.provider === 'stripe' ? 'sk_test_...' : 'Enter your secret key'} className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-9 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none placeholder:text-gray-300" />
                    <button type="button" onClick={() => setShowKeys(!showKeys)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5">
                      {showKeys ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                      )}
                    </button>
                  </div>
                </div>
                <FormInput label={form.provider === 'stripe' ? 'Publishable Key' : 'Public Key'} value={form.publicKey} onChange={(e) => set('publicKey', e.target.value)} placeholder={form.provider === 'stripe' ? 'pk_test_...' : 'Enter your public key'} />
              </div>
            )}
            {!form.provider && <p className="text-xs text-gray-400 mt-2 italic">No gateway — POS records reference numbers only.</p>}
          </Section>

          <Section title="POS Input Fields" badge={`${form.fields.length} field${form.fields.length !== 1 ? 's' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400">Custom fields shown in POS when this method is selected.</p>
              <button type="button" onClick={addField} className="text-xs font-medium text-indigo-600 hover:text-indigo-500 flex items-center gap-1 bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-indigo-100">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Add Field
              </button>
            </div>
            {form.fields.length === 0 && (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                <p className="text-xs text-gray-400">No fields yet. Click "Add Field" to create input fields for the POS.</p>
              </div>
            )}
            <div className="space-y-2.5 max-h-80 overflow-auto">
              {form.fields.map((f, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-3.5 bg-white hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500">{i + 1}</span>
                      <span className="text-xs font-medium text-gray-600">{f.label || 'Unnamed field'}</span>
                    </div>
                    <button type="button" onClick={() => removeField(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-10 gap-2">
                    <div className="col-span-4">
                      <label className="block text-[10px] text-gray-400 mb-0.5">Label</label>
                      <input type="text" value={f.label} onChange={(e) => updateField(i, { label: e.target.value, key: f.key || e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="e.g. Reference #" className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] text-gray-400 mb-0.5">Key</label>
                      <input type="text" value={f.key} onChange={(e) => updateField(i, { key: e.target.value })} placeholder="key_name" className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-mono focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] text-gray-400 mb-0.5">Type</label>
                      <select value={f.type} onChange={(e) => updateField(i, { type: e.target.value })} className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none">
                        {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] text-gray-400 mb-0.5">Req.</label>
                      <select value={f.required ? 'yes' : 'no'} onChange={(e) => updateField(i, { required: e.target.value === 'yes' })} className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none">
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Placeholder</label>
                      <input type="text" value={f.placeholder || ''} onChange={(e) => updateField(i, { placeholder: e.target.value })} placeholder="Placeholder text" className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none" />
                    </div>
                    {f.type === 'text' && (
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Max Length</label>
                        <input type="number" value={f.maxLength || ''} onChange={(e) => updateField(i, { maxLength: e.target.value ? Number(e.target.value) : null })} placeholder="Unlimited" className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none" />
                      </div>
                    )}
                  </div>
                  {f.type === 'select' && (
                    <div className="mt-2">
                      <label className="block text-[10px] text-gray-400 mb-0.5">Options (comma-separated)</label>
                      <input type="text" value={(f.options || []).join(', ')} onChange={(e) => updateField(i, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="Option 1, Option 2, Option 3" className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <div className="flex justify-end gap-3">
            {editingId && <Button variant="ghost" onClick={resetForm}>Cancel</Button>}
            <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-indigo-200">
              {saving ? (
                <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</span>
              ) : editingId ? 'Update Method' : 'Create Method'}
            </button>
          </div>
        </form>
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">All Methods</h2>
        {loading ? <Spinner /> : (
          <div className="space-y-2">
            {items.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>
                <p className="text-sm text-gray-400">No payment methods yet.</p>
                <p className="text-xs text-gray-300 mt-1">Create one using the form.</p>
              </div>
            )}
            {items.map((item) => {
              const itemId = item._id || item.id
              const isSelected = editingId === itemId
              return (
                <div key={itemId}
                  onClick={() => startEdit(item)}
                  className={`group flex items-center gap-4 px-5 py-3.5 rounded-xl border-2 transition-all duration-150 cursor-pointer ${isSelected ? 'border-indigo-300 bg-indigo-50/50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'}`}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
                    {ICON_SVG[item.icon] || ICON_SVG.other}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{item.name}</span>
                      {item.provider && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PROVIDER_COLORS[item.provider] || 'bg-gray-100 text-gray-600'}`}>
                          {item.provider}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400">{(item.fields || []).length} field{(item.fields || []).length !== 1 ? 's' : ''}</span>
                      {item.mode && <span className="text-xs text-gray-300">·</span>}
                      {item.mode && <span className={`text-xs ${item.mode === 'live' ? 'text-amber-500' : 'text-gray-400'}`}>{item.mode === 'live' ? 'Live' : 'Sandbox'}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${item.isActive !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      {item.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                    {canExecute && (
                      <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(itemId); setDeleteConfirmOpen(true) }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

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
