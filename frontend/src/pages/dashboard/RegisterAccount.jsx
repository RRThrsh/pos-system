import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../services/api.js'
import { Button, InputField, Select } from '../../components/index.js'
import { useToast } from '../../context/ToastContext.jsx'

const roles = [
  { value: 'cashier', label: 'Cashier' },
  { value: 'admin', label: 'Admin' },
]

function RegisterAccount() {
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', username: '', password: '', confirmPassword: '', role: 'cashier' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      await authApi.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
      })
      addToast('Account created successfully', 'success')
      navigate('/dashboard/users')
    } catch (err) {
      setError(err.message || 'Failed to create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Register New Account</h2>

        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField label="First Name" name="firstName" required value={form.firstName} onChange={handleChange} />
            <InputField label="Last Name" name="lastName" required value={form.lastName} onChange={handleChange} />
          </div>
          <InputField label="Username" name="username" required value={form.username} onChange={handleChange} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Password" name="password" type="password" required value={form.password} onChange={handleChange} />
            <InputField label="Confirm Password" name="confirmPassword" type="password" required value={form.confirmPassword} onChange={handleChange} />
          </div>
          <Select label="Role" name="role" value={form.role} onChange={handleChange}>
            {roles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => navigate('/dashboard/users')}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterAccount
