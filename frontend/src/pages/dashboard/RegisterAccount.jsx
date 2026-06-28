import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../services/api.js'
import { Button, InputField, Select } from '../../components/index.js'
import { useToast } from '../../context/ToastContext.jsx'

const roles = [
  { value: 'cashier', label: 'Cashier' },
  { value: 'admin', label: 'Admin' },
]

function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
}

function PasswordInput({ label, name, value, onChange, required }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      {label && <label htmlFor={name} className="block text-gray-700 text-sm font-medium mb-1">{label}</label>}
      <div className="relative">
        <input id={name} name={name} type={show ? 'text' : 'password'} required={required} value={value} onChange={onChange}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  )
}

function getStrength(password) {
  let score = 0
  if (password.length >= 6) score += 1
  if (password.length >= 10) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  return score
}

function PasswordStrength({ password }) {
  if (!password) return null
  const score = getStrength(password)
  const width = (score / 5) * 100
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
  const textColors = ['', 'text-red-600', 'text-orange-600', 'text-yellow-600', 'text-blue-600', 'text-green-600']
  return (
    <div className="mt-1.5">
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${colors[score]}`} style={{ width: `${width}%` }} />
      </div>
      <p className={`text-xs mt-0.5 font-medium ${textColors[score]}`}>{labels[score]}</p>
    </div>
  )
}

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
            <div>
              <PasswordInput label="Password" name="password" required value={form.password} onChange={handleChange} />
              <PasswordStrength password={form.password} />
            </div>
            <PasswordInput label="Confirm Password" name="confirmPassword" required value={form.confirmPassword} onChange={handleChange} />
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
