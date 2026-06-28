import { useState, useEffect, useRef, useCallback } from 'react'
import { productsApi, salesApi, promoCodesApi, configApi, heldOrdersApi, categoriesApi } from '../../services/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { getDefaultShortcuts } from '../../constants/shortcuts.js'

function Pos() {
  const { addToast } = useToast()
  const barcodeRef = useRef(null)
  const handleCheckoutRef = useRef()
  const handleBarcodeRef = useRef()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [barcode, setBarcode] = useState('')
  const [results, setResults] = useState([])
  const [cart, setCart] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountPaid, setAmountPaid] = useState('')
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

  const [orderNotes, setOrderNotes] = useState('')
  const [currentTid, setCurrentTid] = useState('')

  const generateTid = () => `#${Math.random().toString(36).slice(2, 12).toUpperCase()}`

  const [showQuickKeys, setShowQuickKeys] = useState(false)
  const [quickKeys, setQuickKeys] = useState([])

  const [heldOrders, setHeldOrders] = useState([])
  const [showHeldOrders, setShowHeldOrders] = useState(false)

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
      return [...prev, { ...product, quantity: 1, notes: '' }]
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

  const removeFromCart = (id) => setCart((prev) => prev.filter((c) => (c._id || c.id) !== id))

  const clearCart = () => {
    if (!cart.length) return
    setCart([])
    addToast('Cart cleared', 'info')
  }

  const updateCartItemNote = (id, notes) => setCart((prev) => prev.map((c) => (c._id || c.id) === id ? { ...c, notes } : c))

  const updateCartItemPrice = (id, price) => {
    const p = parseFloat(price)
    if (isNaN(p) || p < 0) return
    setCart((prev) => prev.map((c) => (c._id || c.id) === id ? { ...c, price: p } : c))
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
        setCart(res.items.map((i) => ({ _id: i.productId, id: i.productId, productId: i.productId, name: i.productName, price: i.price, quantity: i.qty || i.quantity, notes: i.notes || '' })))
      }
      await heldOrdersApi.remove(order._id || order.id)
      setHeldOrders((prev) => prev.filter((o) => (o._id || o.id) !== (order._id || order.id)))
      addToast('Order recalled', 'success'); setShowHeldOrders(false)
    } catch (err) { addToast(err.message || 'Failed to recall order', 'error') }
  }

  const handleCheckout = async () => {
    if (!cart.length) return
    setSubmitting(true)
    try {
      const tid = currentTid || generateTid()
      const sale = await salesApi.create({
        items: cart.map((c) => ({ productId: c._id || c.id, qty: c.quantity, notes: c.notes })),
        transactionId: tid,
        paymentMethod, amountPaid: parseFloat(amountPaid) || total,
        discount: discValue, discountType, orderType: 'walk-in',
        promoCode: promoCode || undefined, tax: taxAmount || undefined, taxRate: taxRate || undefined,
        notes: orderNotes || undefined,
      })
      addToast('Sale completed!', 'success')
      setLastSale({
        ...sale, items: cart, subtotal, discount: discAmount + promoDiscount, tax: taxAmount, taxRate, total,
        paymentMethod, amountPaid: parseFloat(amountPaid) || total, change: change > 0 ? change : 0,
        orderType: 'walk-in', transactionId: tid,
        promoCode: promoCode || undefined, notes: orderNotes, receiptNumber: sale.receiptNumber,
      })
      setCart([]); setCurrentTid(''); setAmountPaid(''); setDiscount(''); setPromoCode(''); setPromoDiscount(0)
      setOrderNotes('')
      setShowReceipt(true)
    } catch (err) { addToast(err.message || 'Checkout failed', 'error') }
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
        ${s.notes ? `<p class="small">${s.notes}</p>` : ''}
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
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cart.length, shortcuts])

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
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
            {cart.length > 0 && (
              <>
                <button onClick={clearCart} className="px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Clear</button>
                <button onClick={handleHoldOrder} className="px-3 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">Hold Order</button>
              </>
            )}
            <div className="relative">
              <button onClick={() => setShowHeldOrders(!showHeldOrders)} className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">Held ({heldOrders.length})</button>
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
            <button onClick={() => setShowQuickKeys(!showQuickKeys)} className={`px-3 py-2 text-sm rounded-lg transition-colors ${showQuickKeys ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Quick Keys ({shortcuts.quickKeys?.key || 'F4'})</button>
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
                  <th className="text-center px-4 py-3 font-medium">Notes</th>
                  <th className="text-center px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cart.map((c) => (
                  <tr key={c._id || c.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-center">
                      <input type="number" step="0.01" min="0" value={c.price} onChange={(e) => updateCartItemPrice(c._id || c.id, e.target.value)} className="w-24 text-center border border-gray-200 rounded px-2 py-1 text-sm" />
                    </td>
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
                    <td className="px-4 py-3 text-center">
                      <input value={c.notes || ''} onChange={(e) => updateCartItemNote(c._id || c.id, e.target.value)} placeholder="notes" className="w-20 text-xs border border-gray-200 rounded px-1 py-1" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => removeFromCart(c._id || c.id)} className="text-red-500 hover:text-red-700 transition-colors">&times;</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="w-80 flex flex-col">
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

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes</label>
            <textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="Notes for this transaction..." rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                <option value="cash">Cash</option><option value="card">Card</option><option value="gcash">GCash</option><option value="maya">Maya</option>
              </select>
            </div>

            {paymentMethod === 'cash' && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                <input type="number" step="0.01" min="0" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0.00" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
            )}

            {amountPaid && parseFloat(amountPaid) >= total && (
              <div className="text-sm text-green-600 font-medium mb-3 flex justify-between">
                <span>Change</span>
                <span>&#8369;{change.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>

          <button onClick={handleCheckout}
            disabled={!cart.length || submitting || (paymentMethod === 'cash' && amountPaid && parseFloat(amountPaid) < total)}
            className="w-full bg-green-600 text-white py-3 rounded-lg text-sm font-bold shadow-sm hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >{submitting ? 'Processing...' : `Charge  \u20B1${total.toLocaleString()} (${shortcuts.charge?.key || 'F2'})`}</button>
        </div>
      </div>

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
