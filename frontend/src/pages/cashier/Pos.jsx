import { useState, useEffect, useRef, useCallback } from 'react'
import { productsApi, salesApi } from '../../services/api.js'
import { useToast } from '../../context/ToastContext.jsx'

function Pos() {
  const { addToast } = useToast()
  const barcodeRef = useRef(null)
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
  const [orderType, setOrderType] = useState('dine-in')
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState(null)

  useEffect(() => {
    productsApi.getAll({ limit: '200' })
      .then((res) => setProducts(res.products || res.data || res || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    const q = search.toLowerCase()
    setResults(products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q)
    ))
  }, [search, products])

  const handleBarcode = useCallback(() => {
    if (!barcode.trim()) return
    const product = products.find((p) => p.barcode === barcode.trim())
    if (product) {
      addToCart(product)
      setBarcode('')
      barcodeRef.current?.focus()
    } else {
      addToast('Product not found for barcode: ' + barcode, 'error')
      setBarcode('')
    }
  }, [barcode, products])

  useEffect(() => {
    if (barcode.length >= 4) {
      handleBarcode()
    }
  }, [barcode])

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((c) => (c._id || c.id) === (product._id || product.id))
      if (existing) {
        return prev.map((c) =>
          (c._id || c.id) === (product._id || product.id)
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    setSearch('')
  }

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((c) =>
        (c._id || c.id) === id
          ? { ...c, quantity: Math.max(1, c.quantity + delta) }
          : c
      ).filter((c) => c.quantity > 0)
    )
  }

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((c) => (c._id || c.id) !== id))
  }

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0)
  const discValue = discount ? parseFloat(discount) : 0
  const discAmount = discountType === 'percentage' ? subtotal * (discValue / 100) : discValue
  const total = Math.max(0, subtotal - discAmount)
  const change = amountPaid ? parseFloat(amountPaid) - total : 0

  const handleCheckout = async () => {
    if (!cart.length) return
    setSubmitting(true)
    try {
      const sale = await salesApi.create({
        items: cart.map((c) => ({
          productId: c._id || c.id,
          name: c.name,
          price: c.price,
          quantity: c.quantity,
        })),
        customerId: undefined,
        paymentMethod,
        amountPaid: parseFloat(amountPaid) || total,
        discount: discValue,
        discountType,
        orderType,
      })
      addToast('Sale completed!', 'success')
      setLastSale({
        ...sale,
        items: cart,
        subtotal,
        discount: discAmount,
        total,
        paymentMethod,
        amountPaid: parseFloat(amountPaid) || total,
        change: change > 0 ? change : 0,
        orderType,
      })
      setCart([])
      setAmountPaid('')
      setDiscount('')
      setShowReceipt(true)
    } catch (err) {
      addToast(err.message || 'Checkout failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const s = lastSale
    const itemsHtml = s.items.map((item) =>
      `<tr><td>${item.name} x${item.quantity}</td><td style="text-align:right">&#8369;${(item.price * item.quantity).toLocaleString()}</td></tr>`
    ).join('')

    printWindow.document.write(`
      <html>
      <head><title>Receipt</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
        h2 { text-align: center; margin: 0 0 5px; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        table { width: 100%; }
        td { padding: 2px 0; }
        .total { font-weight: bold; font-size: 14px; }
        .center { text-align: center; }
      </style>
      </head>
      <body>
        <h2>POS System</h2>
        <p class="center">${new Date().toLocaleString('en-PH')}</p>
        <p class="center">${s.orderType === 'dine-in' ? 'Dine In' : s.orderType === 'takeout' ? 'Takeout' : 'Delivery'}</p>
        <div class="line"></div>
        <table>${itemsHtml}</table>
        <div class="line"></div>
        <table>
          <tr><td>Subtotal</td><td style="text-align:right">&#8369;${s.subtotal.toLocaleString()}</td></tr>
          ${s.discount ? `<tr><td>Discount</td><td style="text-align:right;color:red">-&#8369;${s.discount.toLocaleString()}</td></tr>` : ''}
          <tr class="total"><td>TOTAL</td><td style="text-align:right">&#8369;${s.total.toLocaleString()}</td></tr>
          <tr><td>Paid</td><td style="text-align:right">&#8369;${s.amountPaid.toLocaleString()}</td></tr>
          <tr><td>Change</td><td style="text-align:right">&#8369;${(s.change || 0).toLocaleString()}</td></tr>
        </table>
        <div class="line"></div>
        <p class="center">Thank you, come again!</p>
        <script>window.print();window.close();<\/script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Point of Sale</h1>
          <div className="flex items-center gap-3">
            <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              <option value="dine-in">Dine In</option>
              <option value="takeout">Takeout</option>
              <option value="delivery">Delivery</option>
            </select>
            <div className="relative">
              <input
                ref={barcodeRef}
                type="text"
                placeholder="Scan barcode..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-44 rounded-lg border border-gray-300 px-3 py-2 pl-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search products by name, SKU, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pl-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {results.map((p) => (
                <button
                  key={p._id || p.id}
                  type="button"
                  onClick={() => addToCart(p)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-indigo-50 text-left transition-colors"
                >
                  <div>
                    <span className="font-medium text-gray-900">{p.name}</span>
                    {p.unitValue && p.unit && <span className="text-gray-400 ml-1">{p.unitValue}{p.unit}</span>}
                    <span className="text-gray-400 ml-2">{p.sku}</span>
                  </div>
                  <span className="text-indigo-600 font-semibold">&#8369;{Number(p.price).toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 bg-white rounded-lg shadow overflow-auto">
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Search or scan products to start a sale.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Product</th>
                  <th className="text-center px-4 py-3 font-medium">Qty</th>
                  <th className="text-right px-4 py-3 font-medium">Price</th>
                  <th className="text-right px-4 py-3 font-medium">Subtotal</th>
                  <th className="text-center px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cart.map((c) => (
                  <tr key={c._id || c.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {c.name}
                      {c.unitValue && c.unit && <span className="text-gray-400 ml-1 text-xs">{c.unitValue}{c.unit}</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => updateQty(c._id || c.id, -1)} className="w-7 h-7 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors">-</button>
                        <span className="w-6 text-center font-medium">{c.quantity}</span>
                        <button onClick={() => updateQty(c._id || c.id, 1)} className="w-7 h-7 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors">+</button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">&#8369;{Number(c.price).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium">&#8369;{(c.price * c.quantity).toLocaleString()}</td>
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

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step={discountType === 'percentage' ? '1' : '0.01'}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <select value={discountType} onChange={(e) => { setDiscountType(e.target.value); setDiscount('') }} className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="fixed">&#8369;</option>
                <option value="percentage">%</option>
              </select>
            </div>
          </div>

          <div className="flex-1">
            <div className="text-sm text-gray-500 space-y-1 mb-4">
              <div className="flex justify-between"><span>Items</span><span>{cart.reduce((s, c) => s + c.quantity, 0)}</span></div>
              <div className="flex justify-between"><span>Subtotal</span><span>&#8369;{subtotal.toLocaleString()}</span></div>
              {discAmount > 0 && (
                <div className="flex justify-between text-red-500"><span>Discount</span><span>-&#8369;{discAmount.toLocaleString()}</span></div>
              )}
            </div>
            <div className="border-t pt-3 mb-4">
              <div className="flex justify-between text-lg font-bold text-gray-900"><span>Total</span><span>&#8369;{total.toLocaleString()}</span></div>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="gcash">GCash</option>
                <option value="maya">Maya</option>
              </select>
            </div>

            {paymentMethod === 'cash' && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}

            {amountPaid && parseFloat(amountPaid) >= total && (
              <div className="text-sm text-green-600 font-medium mb-3 flex justify-between">
                <span>Change</span>
                <span>&#8369;{change.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleCheckout}
            disabled={!cart.length || submitting || (paymentMethod === 'cash' && amountPaid && parseFloat(amountPaid) < total)}
            className="w-full bg-green-600 text-white py-3 rounded-lg text-sm font-bold shadow-sm hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Processing...' : `Charge  \u20B1${total.toLocaleString()}`}
          </button>
        </div>
      </div>

      {showReceipt && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowReceipt(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Payment Successful</h2>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2 font-mono">
              <p className="text-center text-gray-500">{new Date().toLocaleString('en-PH')}</p>
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
