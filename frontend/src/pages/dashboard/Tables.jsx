import { useState, useEffect } from 'react'
import { tablesApi } from '../../services/api.js'
import Modal from '../../components/Modal.jsx'
import Spinner from '../../components/Spinner.jsx'
import { Button, InputField, Select } from '../../components/index.js'
import { useToast } from '../../context/ToastContext.jsx'
import { usePermission } from '../../hooks/usePermission.js'

const statusColors = {
  available: 'bg-green-100 border-green-400 text-green-800',
  occupied: 'bg-red-100 border-red-400 text-red-800',
  reserved: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  maintenance: 'bg-gray-100 border-gray-400 text-gray-600',
}

function Tables() {
  const { addToast } = useToast()
  const { canWrite } = usePermission('Tables')
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)
  const [form, setForm] = useState({ number: '', capacity: '', status: 'available' })

  const load = () => {
    setLoading(true)
    tablesApi.getAll()
      .then((res) => setTables(Array.isArray(res) ? res : []))
      .catch((err) => addToast(err.message || 'Failed to load', 'error'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm({ number: '', capacity: '', status: 'available' })
    setModalOpen(true)
  }
  const openEdit = (table) => {
    setSelectedTable(table)
    setForm({ number: table.number?.toString() || '', capacity: table.capacity?.toString() || '', status: table.status || 'available' })
    setEditModalOpen(true)
  }
  const handleCreate = async () => {
    if (!form.number || !form.capacity) return addToast('Table number and capacity are required', 'error')
    try {
      await tablesApi.create({ number: form.number, capacity: Number(form.capacity), floor: '1', status: form.status })
      addToast('Table created', 'success')
      setModalOpen(false)
      load()
    } catch (err) { addToast(err.message || 'Failed to create', 'error') }
  }
  const handleUpdate = async () => {
    if (!selectedTable) return
    try {
      await tablesApi.updateStatus(selectedTable._id || selectedTable.id, form.status, selectedTable.currentSaleId)
      addToast('Table updated', 'success')
      setEditModalOpen(false)
      setSelectedTable(null)
      load()
    } catch (err) { addToast(err.message || 'Failed to update', 'error') }
  }
  const handleDelete = async (table) => {
    if (!confirm(`Delete table ${table.number}?`)) return
    try {
      await tablesApi.remove(table._id || table.id)
      addToast('Table deleted', 'success')
      load()
    } catch (err) { addToast(err.message || 'Failed to delete', 'error') }
  }
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm text-gray-500">{tables.filter((t) => t.status === 'available').length} available of {tables.length} total</h2>
        {canWrite && (
          <Button variant="primary" onClick={openCreate}>+ Add Table</Button>
        )}
      </div>

      {loading ? <Spinner /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {tables.length === 0 ? (
            <div className="text-gray-500 col-span-full text-center py-8">No tables yet. Add your first table to get started.</div>
          ) : tables.map((t) => (
            <button key={t._id || t.id} onClick={() => openEdit(t)} className={`relative p-4 rounded-lg border-2 text-center transition-all hover:shadow-md ${statusColors[t.status] || 'bg-gray-50 border-gray-200'}`}>
              <div className="text-2xl font-bold">{t.number}</div>
              <div className="text-xs mt-1 capitalize">{t.status}</div>
              <div className="text-xs mt-0.5 opacity-75">{t.capacity} seats</div>
              {canWrite && (
                <button onClick={(e) => { e.stopPropagation(); handleDelete(t) }} className="absolute top-1 right-1 text-red-500 hover:text-red-700 text-lg leading-none">&times;</button>
              )}
            </button>
          ))}
        </div>
      )}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Table">
        <div className="space-y-4">
          <InputField name="number" placeholder="Table number (e.g. 1, A2, Patio-3)" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
          <InputField name="capacity" type="number" min={1} placeholder="Capacity (seats)" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          <Select name="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="reserved">Reserved</option>
            <option value="maintenance">Maintenance</option>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate}>Create</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={editModalOpen} onClose={() => { setEditModalOpen(false); setSelectedTable(null) }} title={`Table ${selectedTable?.number || ''}`}>
        <div className="space-y-4">
          <div className="text-sm text-gray-500">{selectedTable?.capacity} seats</div>
          <Select name="editStatus" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="reserved">Reserved</option>
            <option value="maintenance">Maintenance</option>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setEditModalOpen(false); setSelectedTable(null) }}>Cancel</Button>
            <Button variant="primary" onClick={handleUpdate}>Update Status</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
export default Tables
