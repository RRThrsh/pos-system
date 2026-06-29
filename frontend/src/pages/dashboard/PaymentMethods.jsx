import { useState, useEffect } from 'react'
import { paymentMethodsApi } from '../../services/api.js'
import Spinner from '../../components/Spinner.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { usePermission } from '../../hooks/usePermission.js'

function Payment() {
  const { addToast } = useToast()
  const { canWrite } = usePermission('Payment Methods')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [gcashMethod, setGcashMethod] = useState(null)
  const [cashMethod, setCashMethod] = useState(null)
  const [gcashNumber, setGcashNumber] = useState('')
  const [connected, setConnected] = useState(false)
  const [hitpayKey, setHitpayKey] = useState('')
  const [hitpaySalt, setHitpaySalt] = useState('')
  const [hitpayMode, setHitpayMode] = useState('sandbox')
  const [gatewayConnected, setGatewayConnected] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await paymentMethodsApi.getAll()
      const methods = Array.isArray(res) ? res : []
      const gcash = methods.find((m) => m.name.toLowerCase() === 'gcash')
      const cash = methods.find((m) => m.name.toLowerCase() === 'cash')
      setGcashMethod(gcash || null)
      setCashMethod(cash || null)
      if (gcash?.qrCode) {
        setGcashNumber(gcash.qrCode.replace('gcash://pay/', ''))
        setConnected(true)
      }
      if (gcash?.provider === 'hitpay') {
        setHitpayKey(gcash.apiKey || '')
        setHitpaySalt(gcash.publicKey || '')
        setHitpayMode(gcash.mode || 'sandbox')
        setGatewayConnected(true)
      }
    } catch (err) {
      addToast(err.message || 'Failed to load', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const ensureGcashMethod = async () => {
    if (gcashMethod) return gcashMethod._id || gcashMethod.id
    const payload = {
      name: 'GCash', description: 'GCash mobile payment', isActive: true,
      icon: 'gcash', fields: [], provider: '', apiKey: '', publicKey: '', mode: 'sandbox', qrCode: '',
    }
    const created = await paymentMethodsApi.create(payload)
    setGcashMethod(created)
    return created._id || created.id
  }

  const ensureCashMethod = async () => {
    if (cashMethod) return
    const payload = {
      name: 'Cash', description: 'Cash payment', isActive: true,
      icon: 'cash', fields: [], provider: '', apiKey: '', publicKey: '', mode: 'sandbox', qrCode: '',
    }
    const created = await paymentMethodsApi.create(payload)
    setCashMethod(created)
  }

  const handleConnect = async () => {
    const num = gcashNumber.replace(/\s/g, '')
    if (!num) return addToast('Enter your GCash number', 'error')
    if (num.length < 10) return addToast('Invalid GCash number', 'error')
    setSaving(true)
    try {
      const id = await ensureGcashMethod()
      await paymentMethodsApi.update(id, {
        name: 'GCash', description: 'GCash mobile payment', isActive: true,
        icon: 'gcash', fields: [], provider: hitpayKey ? 'hitpay' : '', apiKey: hitpayKey || undefined, publicKey: hitpaySalt || undefined, mode: hitpayMode,
        qrCode: `gcash://pay/${num}`,
      })
      setConnected(true)
      await ensureCashMethod()
      addToast('GCash connected successfully!', 'success')
      load()
    } catch (err) {
      addToast(err.message || 'Failed to connect GCash', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async () => {
    if (!gcashMethod) return
    setSaving(true)
    try {
      const id = gcashMethod._id || gcashMethod.id
      await paymentMethodsApi.update(id, {
        name: 'GCash', description: 'GCash mobile payment', isActive: true,
        icon: 'gcash', fields: [], provider: '', apiKey: '', publicKey: '', mode: 'sandbox',
        qrCode: '',
      })
      setConnected(false)
      setGcashNumber('')
      setGatewayConnected(false)
      setHitpayKey('')
      addToast('GCash disconnected', 'success')
      load()
    } catch (err) {
      addToast(err.message || 'Failed to disconnect', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleGatewayConnect = async () => {
    if (!hitpayKey.trim()) return addToast('Enter your HitPay API key', 'error')
    setSaving(true)
    try {
      const id = gcashMethod._id || gcashMethod.id
      await paymentMethodsApi.update(id, {
        name: 'GCash', description: 'GCash mobile payment', isActive: true,
        icon: 'gcash', fields: [], provider: 'hitpay', apiKey: hitpayKey.trim(), publicKey: hitpaySalt.trim() || undefined, mode: hitpayMode,
        qrCode: `gcash://pay/${gcashNumber}`,
      })
      setGatewayConnected(true)
      addToast('HitPay gateway connected!', 'success')
      load()
    } catch (err) {
      addToast(err.message || 'Failed to connect gateway', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleGatewayDisconnect = async () => {
    if (!gcashMethod) return
    setSaving(true)
    try {
      const id = gcashMethod._id || gcashMethod.id
      await paymentMethodsApi.update(id, {
        name: 'GCash', description: 'GCash mobile payment', isActive: true,
        icon: 'gcash', fields: [], provider: '', apiKey: '', publicKey: '', mode: 'sandbox',
        qrCode: `gcash://pay/${gcashNumber}`,
      })
      setGatewayConnected(false)
      setHitpayKey('')
      setHitpaySalt('')
      addToast('HitPay gateway disconnected', 'success')
      load()
    } catch (err) {
      addToast(err.message || 'Failed to disconnect gateway', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Payment</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your payment methods for the POS.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 bg-emerald-50 border-b border-emerald-100">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">GCash</h2>
            <p className="text-xs text-gray-500">Connect your GCash account to receive payments</p>
          </div>
          {connected && (
            <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Connected
            </span>
          )}
        </div>

        <div className="p-5 space-y-4">
          {!connected ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">GCash Mobile Number</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">+63</span>
                    <input type="tel" value={gcashNumber} onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 10)
                      setGcashNumber(v)
                    }} placeholder="912 345 6789" autoFocus
                      className="w-full rounded-xl border border-gray-300 pl-11 pr-3 py-2.5 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:outline-none" />
                  </div>
                  <button onClick={handleConnect} disabled={saving || gcashNumber.length < 10}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >{saving ? 'Connecting...' : 'Connect'}</button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Enter the mobile number registered with your GCash account.</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">How it works</p>
                    <ul className="text-xs text-gray-500 mt-1.5 space-y-1">
                      <li>• Enter your GCash-registered mobile number</li>
                      <li>• A QR code will be generated for your customers to scan</li>
                      <li>• Customer scans the QR in the POS and pays via GCash app</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="bg-white rounded-xl border-2 border-dashed border-emerald-200 p-3 shadow-sm">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent('gcash://pay/' + gcashNumber)}`}
                    alt="GCash QR" className="w-32 h-32" />
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Connected Account</span>
                    <p className="text-sm font-semibold text-gray-900">+63 {gcashNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}</p>
                  </div>
                  <button onClick={handleDisconnect} disabled={saving}
                    className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                  >{saving ? 'Disconnecting...' : 'Disconnect'}</button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Payment Gateway</h3>
                    <p className="text-xs text-gray-400">Connect HitPay to process GCash payments</p>
                  </div>
                  {gatewayConnected && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      HitPay
                    </span>
                  )}
                </div>
                {!gatewayConnected ? (
                  <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">HitPay API Key</label>
                        <div className="relative">
                          <input type={showKey ? 'text' : 'password'} value={hitpayKey} onChange={(e) => setHitpayKey(e.target.value)} placeholder="Enter your HitPay API key" className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-9 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 focus:outline-none" />
                          <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showKey ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Mode</label>
                        <select value={hitpayMode} onChange={(e) => setHitpayMode(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 focus:outline-none bg-white">
                          <option value="sandbox">Sandbox</option>
                          <option value="live">Live</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">API Salt (for webhook verification)</label>
                      <input type="text" value={hitpaySalt} onChange={(e) => setHitpaySalt(e.target.value)} placeholder="Paste your HitPay API Salt" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 focus:outline-none" />
                    </div>
                    <div className="flex justify-end">
                      <button onClick={handleGatewayConnect} disabled={saving || !hitpayKey.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >{saving ? 'Connecting...' : 'Connect HitPay'}</button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                      <div>
                        <p className="text-sm text-purple-800 font-medium">HitPay {hitpayMode === 'live' ? 'Live' : 'Sandbox'} connected</p>
                        <p className="text-xs text-purple-600">API key: ••••••{hitpayKey.slice(-4)}{hitpaySalt ? ' · Salt saved' : ''}</p>
                      </div>
                    </div>
                    <button onClick={handleGatewayDisconnect} disabled={saving}
                      className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                    >{saving ? 'Removing...' : 'Remove'}</button>
                  </div>
                )}
              </div>

              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                  <div>
                    <p className="text-sm text-emerald-800 font-medium">Ready to receive payments</p>
                    <p className="text-xs text-emerald-600 mt-0.5">When a customer selects GCash in POS, a QR code will be shown for them to scan and pay.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Cash</h2>
            <p className="text-xs text-gray-500">Cash payments are always available in the POS</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-600">No configuration needed. Cashier enters the amount paid and receives change automatically.</p>
        </div>
      </div>
    </div>
  )
}

export default Payment
