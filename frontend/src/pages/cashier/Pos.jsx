import { useState, useEffect, useRef, useCallback } from 'react'
import { productsApi, salesApi, promoCodesApi, configApi, heldOrdersApi, categoriesApi, paymentMethodsApi, paymentsApi } from '../../services/api.js'
import Modal from '../../components/Modal.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { getDefaultShortcuts } from '../../constants/shortcuts.js'

const ICON_MAP = {
  cash: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
  card: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>,
  gcash: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>,
  maya: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" /></svg>,
  bank: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" /></svg>,
  wallet: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" /></svg>,
  other: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
}

function Pos() {
  const { addToast } = useToast()
  const { logout } = useAuth()
  const barcodeRef = useRef(null)
  const handleCheckoutRef = useRef()
  const handleBarcodeRef = useRef()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [barcode, setBarcode] = useState('')
  const [results, setResults] = useState([])
  const [cart, setCart] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentMethodsList, setPaymentMethodsList] = useState([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [paymentDetails, setPaymentDetails] = useState({})
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '', name: '' })
  const [amountPaid, setAmountPaid] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [discount, setDiscount] = useState('')
  const [discountType, setDiscountType] = useState('fixed')
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState(null)

  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoLoading, setPromoLoading] = useState(false)
  const [taxRate, setTaxRate] = useState(0)
  const taxRateLoaded = useRef(false)

  const [currentTid, setCurrentTid] = useState('')

  const generateTid = () => `#${Math.random().toString(36).slice(2, 12).toUpperCase()}`

  const [showQuickKeys, setShowQuickKeys] = useState(false)
  const [quickKeys, setQuickKeys] = useState([])

  const [heldOrders, setHeldOrders] = useState([])
  const [showHeldOrders, setShowHeldOrders] = useState(false)
  const [voidConfirmOpen, setVoidConfirmOpen] = useState(false)
  const [selectedVoidIndex, setSelectedVoidIndex] = useState(0)
  const [confirmingItem, setConfirmingItem] = useState(null)
  const [confirmFocusIndex, setConfirmFocusIndex] = useState(0)
  const voidModalRef = useRef(null)
  const [chargeConfirmOpen, setChargeConfirmOpen] = useState(false)
  const [chargeFocusIndex, setChargeFocusIndex] = useState(0)
  const chargeModalRef = useRef(null)

  useEffect(() => {
    if (voidConfirmOpen) {
      setSelectedVoidIndex(0)
      setConfirmingItem(null)
      setConfirmFocusIndex(0)
      setTimeout(() => voidModalRef.current?.focus(), 50)
    }
  }, [voidConfirmOpen])

  useEffect(() => {
    if (chargeConfirmOpen) {
      setChargeFocusIndex(0)
      setTimeout(() => chargeModalRef.current?.focus(), 50)
    }
  }, [chargeConfirmOpen])

  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [storeInfo, setStoreInfo] = useState({ storeName: 'POS System', storeAddress: '', tin: '', ptuNumber: '' })
  const [shortcuts, setShortcuts] = useState(getDefaultShortcuts)

  useEffect(() => {
    productsApi.getAll({ limit: '200' })
      .then((res) => {
        const all = res.products || res.data || res || []
        setProducts(all)
        setQuickKeys(all.filter((p) => p.stock > 0).slice(0, 12))
      })
      .catch(() => {})
    paymentMethodsApi.getAll().then((res) => { const pm = Array.isArray(res) ? res.filter((m) => m.isActive !== false) : []; if (pm.length && !pm.find((m) => m.name.toLowerCase() === paymentMethod)) { setPaymentMethod(pm[0].name.toLowerCase()); setSelectedPaymentMethod(pm[0]) } setPaymentMethodsList(pm) }).catch(() => {})
    heldOrdersApi.getAll().then((res) => setHeldOrders(Array.isArray(res) ? res : [])).catch(() => {})
    if (!taxRateLoaded.current) {
      configApi.get('taxRate').then((res) => { if (res && res.value) setTaxRate(Number(res.value) || 0); taxRateLoaded.current = true }).catch(() => { taxRateLoaded.current = true })
    }
    Promise.all([
      configApi.get('storeName').catch(() => ({ value: 'POS System' })),
      configApi.get('storeAddress').catch(() => ({ value: '' })),
      configApi.get('tin').catch(() => ({ value: '' })),
      configApi.get('ptuNumber').catch(() => ({ value: '' })),
      configApi.get('receiptFooter').catch(() => ({ value: 'Thank you, come again!' })),
    ]).then(([name, addr, tin, ptu]) => {
      setStoreInfo({
        storeName: name?.value || 'POS System',
        storeAddress: addr?.value || '',
        tin: tin?.value || '',
        ptuNumber: ptu?.value || '',
      })
    }).catch(() => {})
      configApi.get('shortcuts').then((res) => {
      if (res && res.value) {
        try { const parsed = JSON.parse(res.value); setShortcuts(parsed) } catch {}
      }
    }).catch(() => {})
    categoriesApi.getAll().then((res) => setCategories(Array.isArray(res) ? res : [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    const q = search.toLowerCase()
    setResults(products.filter((p) =>
      (p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q)) &&
      (!selectedCategory || p.category === selectedCategory || p.categoryId === selectedCategory)
    ))
  }, [search, products, selectedCategory])

  const handleBarcode = useCallback(() => {
    if (!barcode.trim()) return
    const product = products.find((p) => p.barcode === barcode.trim())
    if (product) { addToCart(product); setBarcode(''); barcodeRef.current?.focus() }
    else { addToast('Product not found for barcode: ' + barcode, 'error'); setBarcode('') }
  }, [barcode, products])
  handleBarcodeRef.current = handleBarcode

  useEffect(() => { if (barcode.length >= 4) handleBarcodeRef.current() }, [barcode])

  const addToCart = (product) => {
    if (!cart.length && !currentTid) setCurrentTid(generateTid())
    setCart((prev) => {
      const existing = prev.find((c) => (c._id || c.id) === (product._id || product.id))
      if (existing) return prev.map((c) => (c._id || c.id) === (product._id || product.id) ? { ...c, quantity: Math.min(c.quantity + 1, product.stock || 99) } : c)
      return [...prev, { ...product, quantity: 1 }]
    })
    setSearch(''); setResults([])
  }

  const updateQty = (id, delta) => {
    setCart((prev) => prev.map((c) => {
      if ((c._id || c.id) !== id) return c
      const product = products.find((p) => (p._id || p.id) === id)
      const max = product?.stock || 99
      return { ...c, quantity: Math.max(1, Math.min(c.quantity + delta, max)) }
    }).filter((c) => c.quantity > 0))
  }

  const clearCart = () => {
    if (!cart.length) return
    setCart([])
    addToast('Cart cleared', 'info')
  }

  const removeFromCart = (id) => {
    setCart((prev) => {
      const next = prev.filter((c) => (c._id || c.id) !== id)
      if (!next.length) setVoidConfirmOpen(false)
      return next
    })
  }

  const confirmVoidItem = () => {
    const c = confirmingItem
    if (!c) return
    removeFromCart(c._id || c.id)
    setConfirmingItem(null)
    addToast(`${c.name} removed from cart`, 'info')
  }

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0)
  const discValue = discount ? parseFloat(discount) : 0
  const discAmount = discountType === 'percentage' ? subtotal * (discValue / 100) : discValue
  const afterDiscount = Math.max(0, subtotal - discAmount - promoDiscount)
  const taxAmount = taxRate > 0 ? afterDiscount * (taxRate / 100) : 0
  const total = afterDiscount + taxAmount
  const change = amountPaid ? parseFloat(amountPaid) - total : 0

  const applyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    try {
      const res = await promoCodesApi.validate(promoCode, subtotal)
      if (res.valid) { setPromoDiscount(res.discount); addToast(`Promo applied: -₱${res.discount.toLocaleString()}`, 'success') }
    } catch (err) { setPromoDiscount(0); addToast(err.message || 'Invalid promo code', 'error') }
    finally { setPromoLoading(false) }
  }

  const handleHoldOrder = async () => {
    if (!cart.length) return
    try {
      await heldOrdersApi.create({ items: cart, subtotal })
      addToast('Order held', 'success')
      setCart([])
      heldOrdersApi.getAll().then((res) => setHeldOrders(Array.isArray(res) ? res : [])).catch(() => {})
    } catch (err) { addToast(err.message || 'Failed to hold order', 'error') }
  }

  const recallOrder = async (order) => {
    try {
      const res = await heldOrdersApi.getById(order._id || order.id)
      if (res && res.items) {
        setCart(res.items.map((i) => ({ _id: i.productId, id: i.productId, productId: i.productId, name: i.productName, price: i.price, quantity: i.qty || i.quantity })))
      }
      await heldOrdersApi.remove(order._id || order.id)
      setHeldOrders((prev) => prev.filter((o) => (o._id || o.id) !== (order._id || order.id)))
      addToast('Order recalled', 'success'); setShowHeldOrders(false)
    } catch (err) { addToast(err.message || 'Failed to recall order', 'error') }
  }

  const handleCheckout = async () => {
    if (!cart.length) return
    setSubmitting(true)

    const method = selectedPaymentMethod || paymentMethodsList.find((m) => m.name.toLowerCase() === paymentMethod)
    const hasGateway = method?.provider && method.apiKey

    try {
      let pmResult
      if (hasGateway) {
        setProcessingPayment(true)
        pmResult = await paymentsApi.processPayment({
          methodId: method._id || method.id,
          amount: total,
          cardDetails: method.provider === 'stripe' && paymentMethod !== 'cash' ? cardDetails : undefined,
        })
        setProcessingPayment(false)
        if (pmResult.status !== 'succeeded' && pmResult.status !== 'requires_capture' && pmResult.status !== 'requires_confirmation') {
          const paymentId = pmResult.id || 'unknown'
          addToast(`Payment initiated (${paymentId}). Waiting for customer to complete...`, 'info')
        }
      }

      const tid = currentTid || generateTid()
      const sale = await salesApi.create({
        items: cart.map((c) => ({ productId: c._id || c.id, qty: c.quantity })),
        transactionId: tid,
        paymentMethod, amountPaid: parseFloat(amountPaid) || total,
        paymentDetails: Object.keys(paymentDetails).length ? paymentDetails : undefined,
        discount: discValue, discountType, orderType: 'walk-in',
        promoCode: promoCode || undefined, tax: taxAmount || undefined, taxRate: taxRate || undefined,
        paymentIntentId: pmResult?.id,
        paymentStatus: pmResult?.status,
      })
      addToast('Sale completed!', 'success')
      setLastSale({
        ...sale, items: cart, subtotal, discount: discAmount + promoDiscount, tax: taxAmount, taxRate, total,
        paymentMethod, paymentDetails: Object.keys(paymentDetails).length ? paymentDetails : undefined,
        amountPaid: parseFloat(amountPaid) || total, change: change > 0 ? change : 0,
        orderType: 'walk-in', transactionId: tid,
        promoCode: promoCode || undefined, receiptNumber: sale.receiptNumber,
      })
      setCart([]); setCurrentTid(''); setAmountPaid(''); setDiscount(''); setPromoCode(''); setPromoDiscount(0); setPaymentDetails({}); setCardDetails({ number: '', expiry: '', cvc: '', name: '' })
      setShowReceipt(true)
    } catch (err) {
      setProcessingPayment(false)
      addToast(err.message || 'Checkout failed', 'error')
    }
    finally { setSubmitting(false) }
  }
  handleCheckoutRef.current = handleCheckout

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const s = lastSale
    const itemsHtml = s.items.map((item) =>
      `<tr><td>${item.name} x${item.quantity}</td><td style="text-align:right">&#8369;${(item.price * item.quantity).toLocaleString()}</td></tr>`
    ).join('')
    const totalInWords = numberToWords(s.total)
    printWindow.document.write(`
      <html><head><title>Receipt</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
        h2 { text-align: center; margin: 0 0 2px; font-size: 14px; }
        .sub { text-align: center; font-size: 10px; margin: 2px 0; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        table { width: 100%; }
        td { padding: 2px 0; }
        .total { font-weight: bold; font-size: 14px; }
        .center { text-align: center; }
        .small { font-size: 10px; }
        .words { font-size: 10px; text-align: center; margin: 4px 0; }
      </style></head><body>
        <h2>${storeInfo.storeName}</h2>
        ${storeInfo.storeAddress ? `<p class="sub">${storeInfo.storeAddress}</p>` : ''}
        ${storeInfo.tin ? `<p class="sub">TIN: ${storeInfo.tin}</p>` : ''}
        ${storeInfo.ptuNumber ? `<p class="sub">PTU: ${storeInfo.ptuNumber}</p>` : ''}
        <p class="sub">${new Date().toLocaleString('en-PH')}</p>
        ${s.receiptNumber ? `<p class="sub">OR #: ${s.receiptNumber}</p>` : ''}
        ${s.transactionId ? `<p class="sub">Txn: ${s.transactionId}</p>` : ''}
        <div class="line"></div>
        <table>${itemsHtml}</table>
        <div class="line"></div>
        <table>
          <tr><td>Subtotal</td><td style="text-align:right">&#8369;${s.subtotal.toLocaleString()}</td></tr>
          ${s.discount ? `<tr><td>Discount</td><td style="text-align:right;color:red">-&#8369;${s.discount.toLocaleString()}</td></tr>` : ''}
          ${s.promoCode ? `<tr><td>Promo (${s.promoCode})</td><td style="text-align:right;color:red">-&#8369;${(s.promoDiscount || 0).toLocaleString()}</td></tr>` : ''}
          ${s.tax ? `<tr><td>Tax (${s.taxRate || 0}%)</td><td style="text-align:right">&#8369;${s.tax.toLocaleString()}</td></tr>` : ''}
          <tr class="total"><td>TOTAL</td><td style="text-align:right">&#8369;${s.total.toLocaleString()}</td></tr>
          <tr><td>Paid</td><td style="text-align:right">&#8369;${s.amountPaid.toLocaleString()}</td></tr>
          <tr><td>Change</td><td style="text-align:right">&#8369;${(s.change || 0).toLocaleString()}</td></tr>
        </table>
        <p class="words">${totalInWords}</p>
        <div class="line"></div>
        <p class="center">${storeInfo.receiptFooter || 'Thank you, come again!'}</p>
        <script>window.print();window.close();<\/script>
      </body></html>
    `)
    printWindow.document.close()
  }

  const numberToWords = (n) => {
    if (!n || n === 0) return 'Zero Pesos'
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    const convert = (num) => {
      if (num < 20) return ones[num]
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '')
      if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + convert(num % 100) : '')
      if (num < 1000000) return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + convert(num % 1000) : '')
      return convert(Math.floor(num / 1000000)) + ' Million' + (num % 1000000 ? ' ' + convert(num % 1000000) : '')
    }
    const peso = Math.floor(n)
    const cent = Math.round((n - peso) * 100)
    let result = convert(peso) + ' Peso' + (peso !== 1 ? 's' : '')
    if (cent > 0) result += ' and ' + convert(cent) + ' Centavo' + (cent !== 1 ? 's' : '')
    return result
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.repeat) return
      const s = shortcuts
      if (e.key === s.charge?.key && cart.length) { e.preventDefault(); handleCheckoutRef.current() }
      if (e.key === s.scan?.key) { e.preventDefault(); barcodeRef.current?.focus() }
      if (e.key === s.quickKeys?.key) { e.preventDefault(); setShowQuickKeys(prev => !prev) }
      if (e.key === s.close?.key) { e.preventDefault(); setShowReceipt(false); setShowHeldOrders(false) }
      if (e.key === s.fullscreen?.key) { e.preventDefault(); toggleFullscreen() }
      if (e.key === s.logout?.key) { e.preventDefault(); logout() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cart.length, shortcuts])

  return (
    <div className="flex p-8 gap-6 h-[calc(100vh-8rem)]">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <input ref={barcodeRef} type="text" placeholder={`Scan barcode (${shortcuts.scan?.key || 'F3'})...`} value={barcode} onChange={(e) => setBarcode(e.target.value)}
                className="w-44 rounded-lg border border-gray-300 px-3 py-2 pl-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                onKeyDown={(e) => { if (e.key === 'Enter') handleBarcode() }}
              />
              <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" /></svg>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowQuickKeys(!showQuickKeys)} className={`px-3 py-2 text-sm rounded-lg transition-colors ${showQuickKeys ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Quick Keys ({shortcuts.quickKeys?.key || 'F4'})</button>
            <button onClick={logout} className="px-3 py-2 text-sm rounded-lg bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600 transition-colors" title={`Logout (${shortcuts.logout?.key || 'F12'})`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
            </button>
          </div>
        </div>

        {showQuickKeys && (
          <div className="mb-4">
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {quickKeys.map((p) => {
                const lowStock = p.stock <= 5
                return (
                <button key={p._id || p.id} onClick={() => addToCart(p)} className={`bg-white border rounded-lg p-2 text-center hover:shadow-sm transition-all ${lowStock ? 'border-red-200 hover:border-red-400' : 'border-gray-200 hover:border-indigo-400'}`}>
                  <div className="text-xs font-medium text-gray-800 truncate">{p.name}</div>
                  <div className="text-xs text-indigo-600 font-semibold">&#8369;{Number(p.price).toLocaleString()}</div>
                  {lowStock && <div className="text-[10px] text-red-500 font-medium mt-0.5">{p.stock} left</div>}
                </button>
                )
              })}
            </div>
          </div>
        )}

        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
            <button onClick={() => setSelectedCategory('')}
              className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${!selectedCategory ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>All</button>
            {categories.map((c) => (
              <button key={c._id || c.id || c.name} onClick={() => setSelectedCategory(c.name || c._id || c.id)}
                className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${selectedCategory === (c.name || c._id || c.id) ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>{c.name}</button>
            ))}
          </div>
        )}
        <div className="relative mb-4">
          <input type="text" placeholder="Search products by name, SKU, or barcode..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pl-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {results.map((p) => {
                const lowStock = p.stock <= 5
                return (
                <button key={p._id || p.id} type="button" onClick={() => addToCart(p)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-indigo-50 text-left transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{p.name}</span>
                    {lowStock && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">{p.stock} left</span>}
                    {p.unitValue && p.unit && <span className="text-gray-400">{p.unitValue}{p.unit}</span>}
                    <span className="text-gray-400">{p.sku}</span>
                  </div>
                  <span className="text-indigo-600 font-semibold">&#8369;{Number(p.price).toLocaleString()}</span>
                </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex-1 bg-white rounded-lg shadow overflow-auto">
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400"><p>Search or scan products to start a sale. Press {shortcuts.charge?.key || 'F2'} to charge.</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Product</th>
                  <th className="text-center px-4 py-3 font-medium">Price</th>
                  <th className="text-center px-4 py-3 font-medium">Qty</th>
                  <th className="text-right px-4 py-3 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cart.map((c) => (
                  <tr key={c._id || c.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-center font-medium">&#8369;{Number(c.price).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => updateQty(c._id || c.id, -1)} className="w-7 h-7 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors">-</button>
                        <input type="number" min="1" value={c.quantity}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10)
                            if (!isNaN(v) && v > 0) {
                              const product = products.find((p) => (p._id || p.id) === (c._id || c.id))
                              const max = product?.stock || 99
                              setCart((prev) => prev.map((ci) => (ci._id || ci.id) === (c._id || c.id) ? { ...ci, quantity: Math.min(v, max) } : ci))
                            }
                          }}
                          className="w-12 text-center border border-gray-200 rounded px-1 py-1 text-sm" />
                        <button onClick={() => updateQty(c._id || c.id, 1)} className="w-7 h-7 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors">+</button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">&#8369;{(c.price * c.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="w-96 flex flex-col">
        <div className="bg-white rounded-lg shadow p-5 flex flex-col h-full">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h2>

          {currentTid && (
            <div className="mb-3 px-3 py-2 bg-gray-50 rounded-lg text-center">
              <span className="text-xs text-gray-500">Txn:</span>
              <span className="text-sm font-mono font-semibold text-gray-800 ml-1">{currentTid}</span>
            </div>
          )}

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
            <div className="flex gap-2">
              <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="Enter code" disabled={promoDiscount > 0}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              {promoDiscount > 0 ? (
                <button onClick={() => { setPromoCode(''); setPromoDiscount(0) }} className="px-3 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200">X</button>
              ) : (
                <button onClick={applyPromo} disabled={!promoCode.trim() || promoLoading} className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">{promoLoading ? '...' : 'Apply'}</button>
              )}
            </div>
          </div>

          {taxRate > 0 && <div className="text-xs text-gray-500 mb-3">Tax rate: {taxRate}%</div>}

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
            <div className="flex gap-2">
              <input type="number" min="0" step={discountType === 'percentage' ? '1' : '0.01'} value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              <select value={discountType} onChange={(e) => { setDiscountType(e.target.value); setDiscount('') }} className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                <option value="fixed">&#8369;</option><option value="percentage">%</option>
              </select>
            </div>
          </div>


          <div className="flex-1">
            <div className="text-sm text-gray-500 space-y-1 mb-4">
              <div className="flex justify-between"><span>Items</span><span>{cart.reduce((s, c) => s + c.quantity, 0)}</span></div>
              <div className="flex justify-between"><span>Subtotal</span><span>&#8369;{subtotal.toLocaleString()}</span></div>
              {discAmount > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>-&#8369;{discAmount.toLocaleString()}</span></div>}
              {promoDiscount > 0 && <div className="flex justify-between text-red-500"><span>Promo ({promoCode})</span><span>-&#8369;{promoDiscount.toLocaleString()}</span></div>}
              {taxAmount > 0 && <div className="flex justify-between text-gray-600"><span>Tax ({taxRate}%)</span><span>&#8369;{taxAmount.toLocaleString()}</span></div>}
            </div>
            <div className="border-t pt-3 mb-4">
              <div className="flex justify-between text-lg font-bold text-gray-900"><span>Total</span><span>&#8369;{total.toLocaleString()}</span></div>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="grid grid-cols-4 gap-2">
                {(paymentMethodsList.length > 0 ? paymentMethodsList : [
                  { name: 'Cash', icon: 'cash', fields: [] },
                  { name: 'Card', icon: 'card', fields: [{ label: 'Card Type', key: 'cardType', type: 'select', required: true, options: ['Visa', 'Mastercard', 'Amex', 'JCB', 'Other'] }, { label: 'Last 4 Digits', key: 'cardLast4', type: 'text', required: true, maxLength: 4 }, { label: 'Reference #', key: 'cardRef', type: 'text', placeholder: 'Auth code' }] },
                  { name: 'GCash', icon: 'gcash', fields: [{ label: 'Reference Number', key: 'gcashRef', type: 'text', required: true, placeholder: 'GCash reference #' }, { label: 'Sender Name', key: 'gcashSender', type: 'text', placeholder: "Sender's full name" }] },
                  { name: 'Maya', icon: 'maya', fields: [{ label: 'Reference Number', key: 'mayaRef', type: 'text', required: true, placeholder: 'Maya reference #' }, { label: 'Account Name', key: 'mayaAccount', type: 'text', placeholder: 'Account holder name' }] },
                ]).map((m) => {
                  const val = m.name.toLowerCase()
                  return (
                    <button key={val}
                      onClick={() => { setPaymentMethod(val); setPaymentDetails({}); setSelectedPaymentMethod(m) }}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium transition-all border-2 ${paymentMethod === val ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      {ICON_MAP[m.icon || 'other']}
                      <span>{m.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                <input type="text" inputMode="decimal" value={amountPaid}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
                    if (parseFloat(v) > 999999.99) return
                    setAmountPaid(v)
                  }}
                  placeholder="0.00" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
            )}

            {paymentMethod !== 'cash' && (() => {
              const selected = (paymentMethodsList.length > 0 ? paymentMethodsList : []).find((m) => m.name.toLowerCase() === paymentMethod)
              const fields = selected?.fields || []
              if (!fields.length) return null
              return (
                <div className="mb-3 space-y-2">
                  {fields.map((f, i) => {
                    const val = paymentDetails[f.key] || ''
                    const setVal = (v) => setPaymentDetails((p) => ({ ...p, [f.key]: v }))
                    if (f.type === 'select') {
                      return (
                        <div key={i}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}{f.required ? ' *' : ''}</label>
                          <select value={val} onChange={(e) => setVal(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                            <option value="">{f.placeholder || `Select ${f.label}`}</option>
                            {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      )
                    }
                    return (
                      <div key={i}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}{f.required ? ' *' : ''}</label>
                        <input type={f.type === 'number' ? 'number' : 'text'}
                          inputMode={f.type === 'number' ? 'decimal' : undefined}
                          maxLength={f.maxLength || undefined}
                          value={val}
                          onChange={(e) => setVal(f.type === 'number' ? e.target.value.replace(/[^0-9.]/g, '') : f.maxLength ? e.target.value.slice(0, f.maxLength) : e.target.value)}
                          placeholder={f.placeholder || ''}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            {amountPaid && parseFloat(amountPaid) >= total && (
              <div className="text-sm text-green-600 font-medium mb-3 flex justify-between">
                <span>Change</span>
                <span>&#8369;{change.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mb-2">
            <button onClick={handleHoldOrder} disabled={!cart.length} className="flex-1 px-3 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Hold Order</button>
            <div className="relative flex-1">
              <button onClick={() => setShowHeldOrders(!showHeldOrders)} className="w-full px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">Held ({heldOrders.length})</button>
              {showHeldOrders && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-auto">
                  <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-800">Held Orders</div>
                  {heldOrders.length === 0 ? <p className="text-sm text-gray-500 text-center py-6">No held orders.</p> : heldOrders.map((o) => (
                    <button key={o._id || o.id} onClick={() => recallOrder(o)} className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <div className="text-sm font-medium text-gray-800">Walk-in</div>
                      <div className="text-xs text-gray-500">{o.items?.length || 0} items &middot; &#8369;{Number(o.subtotal || 0).toLocaleString()}</div>
                      <div className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setVoidConfirmOpen(true)}
              disabled={!cart.length}
              className="flex-1 bg-red-500 text-white py-3 rounded-lg text-sm font-bold shadow-sm hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >Void</button>
            <button onClick={() => setChargeConfirmOpen(true)}
              disabled={!cart.length || submitting || (paymentMethod === 'cash' && (!amountPaid || parseFloat(amountPaid) < total)) || processingPayment}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg text-sm font-bold shadow-sm hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >{submitting ? 'Processing...' : `Charge  \u20B1${total.toLocaleString()} (${shortcuts.charge?.key || 'F2'})`}</button>
          </div>
        </div>
      </div>

      <Modal isOpen={voidConfirmOpen} onClose={() => setVoidConfirmOpen(false)} title="Void Item">
        <div className="space-y-3" tabIndex={0} ref={voidModalRef}
          onKeyDown={(e) => {
            if (confirmingItem) {
              if (e.key === 'Escape') { e.preventDefault(); setVoidConfirmOpen(false); return }
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); setConfirmFocusIndex((prev) => prev === 0 ? 1 : 0); return }
              if (e.key === 'Enter') { e.preventDefault(); if (confirmFocusIndex === 0) { setConfirmingItem(null); setTimeout(() => voidModalRef.current?.focus(), 50) } else { confirmVoidItem() }; return }
              return
            }
            if (e.key === 'Escape') { e.preventDefault(); setVoidConfirmOpen(false); return }
            if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedVoidIndex((prev) => Math.min(prev + 1, cart.length - 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedVoidIndex((prev) => Math.max(prev - 1, 0)) }
            if (e.key === 'Enter') { e.preventDefault(); const c = cart[selectedVoidIndex]; if (c) { setConfirmingItem(c); setConfirmFocusIndex(1) } }
          }}
        >
          {confirmingItem ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800">Void this item?</p>
                  <p className="text-sm text-red-700"><strong>{confirmingItem.name}</strong> x{confirmingItem.quantity} &mdash; &#8369;{(confirmingItem.price * confirmingItem.quantity).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400"><kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">&#8592;</kbd> <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">&#8594;</kbd> navigate &middot; <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">Enter</kbd> select &middot; <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">Esc</kbd> exit</span>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setConfirmingItem(null); setTimeout(() => voidModalRef.current?.focus(), 50) }} className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${confirmFocusIndex === 0 ? 'ring-2 ring-offset-1 ring-gray-400 bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Cancel</button>
                <button onClick={() => { confirmVoidItem() }} className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${confirmFocusIndex === 1 ? 'ring-2 ring-offset-1 ring-red-400 bg-red-600 text-white' : 'bg-red-500 text-white hover:bg-red-600'}`}>Yes, void it</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Select an item to void</p>
                <span className="text-[10px] text-gray-400"><kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">&#8593;</kbd> <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">&#8595;</kbd> navigate &middot; <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">Enter</kbd> select &middot; <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">Esc</kbd> exit</span>
              </div>
              <div className="max-h-64 overflow-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                {cart.map((c, i) => (
                  <div key={i}
                    onDoubleClick={() => setConfirmingItem(c)}
                    className={`flex items-center justify-between px-4 py-3 text-sm cursor-pointer transition-all ${selectedVoidIndex === i ? 'bg-red-50 border-l-4 border-red-500 -ml-px' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${selectedVoidIndex === i ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</span>
                      <span className="truncate font-medium text-gray-800">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-gray-400">x{c.quantity}</span>
                      <span className="font-semibold text-gray-900 w-20 text-right">&#8369;{(c.price * c.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button onClick={() => setVoidConfirmOpen(false)} className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">Close</button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={chargeConfirmOpen} onClose={() => setChargeConfirmOpen(false)} title="Confirm Charge">
        <div className="space-y-4" tabIndex={0} ref={chargeModalRef}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { e.preventDefault(); setChargeConfirmOpen(false); return }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); setChargeFocusIndex((prev) => prev === 0 ? 1 : 0); return }
            if (e.key === 'Enter') { e.preventDefault(); if (chargeFocusIndex === 1) { setChargeConfirmOpen(false); handleCheckout() } else { setChargeConfirmOpen(false) }; return }
          }}
        >
          <div className="max-h-48 overflow-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
            {cart.map((c, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="truncate text-gray-800">{c.name} <span className="text-gray-400">x{c.quantity}</span></span>
                <span className="font-medium text-gray-900">&#8369;{(c.price * c.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>&#8369;{subtotal.toLocaleString()}</span></div>
            {(discAmount > 0 || promoDiscount > 0) && <div className="flex justify-between text-green-600"><span>Discount</span><span>-&#8369;{(discAmount + promoDiscount).toLocaleString()}</span></div>}
            {taxAmount > 0 && <div className="flex justify-between text-gray-600"><span>Tax ({(taxRate).toFixed(1)}%)</span><span>&#8369;{taxAmount.toLocaleString()}</span></div>}
            <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-1.5"><span>Total</span><span>&#8369;{total.toLocaleString()}</span></div>
            {paymentMethod === 'cash' && amountPaid && (
              <div className="flex justify-between text-gray-600"><span>Amount Paid</span><span>&#8369;{parseFloat(amountPaid).toLocaleString()}</span></div>
            )}
            {change > 0 && <div className="flex justify-between text-gray-600"><span>Change</span><span>&#8369;{change.toLocaleString()}</span></div>}

            {(() => {
              const method = selectedPaymentMethod || paymentMethodsList.find((m) => m.name.toLowerCase() === paymentMethod)
              if (!method?.provider || !method?.apiKey) return null
              if (method.provider === 'stripe') {
                return (
                  <div className="border-t border-gray-200 pt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Card Payment</p>
                    <input type="text" placeholder="Cardholder Name" value={cardDetails.name} onChange={(e) => setCardDetails((p) => ({ ...p, name: e.target.value }))} className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                    <input type="text" placeholder="Card Number" value={cardDetails.number} onChange={(e) => setCardDetails((p) => ({ ...p, number: e.target.value.replace(/[^0-9\s]/g, '').slice(0, 19) }))} className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="MM/YY" value={cardDetails.expiry} onChange={(e) => setCardDetails((p) => ({ ...p, expiry: e.target.value.replace(/[^0-9\/]/g, '').slice(0, 5) }))} className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                      <input type="text" placeholder="CVC" value={cardDetails.cvc} onChange={(e) => setCardDetails((p) => ({ ...p, cvc: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) }))} className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                    </div>
                    <p className="text-[10px] text-gray-400">For sandbox testing, use card 4242 4242 4242 4242</p>
                  </div>
                )
              }
              return (
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{method.provider === 'paymongo' ? 'PayMongo Payment' : 'Gateway Payment'}</p>
                  <p className="text-xs text-gray-400 mt-1">Payment will be processed through {method.provider}.</p>
                </div>
              )
            })()}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400"><kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">&#8592;</kbd> <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">&#8594;</kbd> navigate &middot; <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">Enter</kbd> confirm &middot; <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">Esc</kbd> cancel</span>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setChargeConfirmOpen(false)} className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${chargeFocusIndex === 0 ? 'ring-2 ring-offset-1 ring-gray-400 bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Cancel</button>
            <button onClick={() => { setChargeConfirmOpen(false); handleCheckout() }} className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${chargeFocusIndex === 1 ? 'ring-2 ring-offset-1 ring-green-400 bg-green-600 text-white' : 'bg-green-500 text-white hover:bg-green-600'}`}>Confirm Charge</button>
          </div>
        </div>
      </Modal>

      {showReceipt && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowReceipt(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Payment Successful</h2>
              {lastSale.receiptNumber && <p className="text-xs text-gray-500 mt-1">OR #: {lastSale.receiptNumber}</p>}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2 font-mono">
              <p className="text-center text-gray-500">{new Date().toLocaleString('en-PH')}</p>
              {lastSale.transactionId && <p className="text-center text-gray-600 text-xs">Txn: {lastSale.transactionId}</p>}
              <div className="border-t border-dashed border-gray-300 my-2" />
              {lastSale.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.name} x{item.quantity}</span>
                  <span>&#8369;{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-dashed border-gray-300 my-2" />
              <div className="flex justify-between"><span>Subtotal</span><span>&#8369;{lastSale.subtotal.toLocaleString()}</span></div>
              {lastSale.discount > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>-&#8369;{lastSale.discount.toLocaleString()}</span></div>}
              {lastSale.promoCode && <div className="flex justify-between text-red-500"><span>Promo ({lastSale.promoCode})</span><span>-&#8369;{(lastSale.promoDiscount || 0).toLocaleString()}</span></div>}
              {lastSale.tax > 0 && <div className="flex justify-between"><span>Tax ({lastSale.taxRate || 0}%)</span><span>&#8369;{lastSale.tax.toLocaleString()}</span></div>}
              <div className="flex justify-between font-bold text-base"><span>TOTAL</span><span>&#8369;{lastSale.total.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Paid</span><span>&#8369;{lastSale.amountPaid.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Change</span><span>&#8369;{(lastSale.change || 0).toLocaleString()}</span></div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowReceipt(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Close</button>
              <button onClick={handlePrint} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors">Print Receipt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Pos
