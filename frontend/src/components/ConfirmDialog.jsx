import { useState } from 'react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'

function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Confirm', message = 'Are you sure?', confirmText = 'Confirm', confirmVariant = 'primary', children }) {
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = () => {
    if (!confirmed) return
    onConfirm()
    setConfirmed(false)
  }

  const handleClose = () => {
    setConfirmed(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="space-y-4">
        {message && <p className="text-sm text-gray-600">{message}</p>}
        {children}
        <label className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-amber-800 font-medium">
            I confirm that I want to proceed with this action.
          </span>
        </label>
        <div className="flex justify-end gap-3 pt-1">
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button variant={confirmVariant} onClick={handleConfirm} disabled={!confirmed}>{confirmText}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
