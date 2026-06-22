import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

export const list = query({
  args: {
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { dateFrom, dateTo, page = 1, limit = 20 }) => {
    let sales = await ctx.db.query("sales").collect()

    if (dateFrom) sales = sales.filter((s) => new Date(s.createdAt) >= new Date(dateFrom))
    if (dateTo) sales = sales.filter((s) => new Date(s.createdAt) <= new Date(dateTo))
    sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const start = (page - 1) * limit
    const end = start + limit
    return {
      data: sales.slice(start, end),
      total: sales.length,
      page,
      limit,
      totalPages: Math.ceil(sales.length / limit),
    }
  },
})

export const getById = query({
  args: { id: v.id("sales") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id)
  },
})

export const create = mutation({
  args: {
    items: v.array(v.object({
      productId: v.id("products"),
      qty: v.number(),
      notes: v.optional(v.string()),
    })),
    transactionId: v.optional(v.string()),
    receiptNumber: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    amountPaid: v.optional(v.number()),
    discount: v.optional(v.number()),
    discountType: v.optional(v.string()),
    orderType: v.optional(v.string()),
    promoCode: v.optional(v.string()),
    tax: v.optional(v.number()),
    taxRate: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
    customerId: v.optional(v.id("customers")),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    buyerTin: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { items, transactionId, receiptNumber, paymentMethod, amountPaid, discount, discountType, orderType, promoCode, tax, taxRate, createdBy, customerId, customerName, customerPhone, buyerTin, notes }) => {
    const saleItems = []
    let subtotal = 0

    for (const item of items) {
      const product = await ctx.db.get(item.productId)
      if (!product) throw new Error(`Product ${item.productId} not found`)
      if (product.stock < item.qty) throw new Error(`Insufficient stock for ${product.name}`)

      const lineTotal = product.price * item.qty
      subtotal += lineTotal
      saleItems.push({
        productId: item.productId,
        productName: product.name,
        price: product.price,
        qty: item.qty,
        total: lineTotal,
        notes: item.notes,
      })

      await ctx.db.patch(item.productId, { stock: product.stock - item.qty, updatedAt: new Date().toISOString() })
    }

    const disc = discount ?? 0
    const discAmt = discountType === "percentage" ? subtotal * (disc / 100) : disc
    const afterDiscount = Math.max(0, subtotal - discAmt)
    const taxAmt = tax ?? (taxRate ? afterDiscount * (taxRate / 100) : 0)
    const total = afterDiscount + taxAmt
    const change = amountPaid ? amountPaid - total : 0

    if (customerId) {
      const customer = await ctx.db.get(customerId)
      if (customer) {
        await ctx.db.patch(customerId, {
          totalSpent: (customer.totalSpent || 0) + total,
          visitCount: (customer.visitCount || 0) + 1,
          lastVisit: new Date().toISOString(),
        })
      }
    }

    return await ctx.db.insert("sales", {
      items: saleItems,
      total,
      discount: discAmt,
      discountType: discountType ?? "fixed",
      orderType: orderType ?? "walk-in",
      transactionId,
      receiptNumber,
      paymentMethod: paymentMethod ?? "cash",
      amountPaid: amountPaid ?? total,
      change: change > 0 ? change : 0,
      status: "completed",
      promoCode,
      tax: taxAmt,
      taxRate,
      customerId,
      customerName,
      customerPhone,
      buyerTin,
      notes,
      createdBy,
      createdAt: new Date().toISOString(),
      voidedAt: undefined,
    })
  },
})

export const voidSale = mutation({
  args: { id: v.id("sales") },
  handler: async (ctx, { id }) => {
    const sale = await ctx.db.get(id)
    if (!sale) throw new Error("Sale not found")
    if (sale.status === "voided") throw new Error("Sale is already voided")

    for (const item of sale.items) {
      const product = await ctx.db.get(item.productId)
      if (product) {
        await ctx.db.patch(item.productId, { stock: product.stock + item.qty, updatedAt: new Date().toISOString() })
      }
    }

    await ctx.db.patch(id, { status: "voided", voidedAt: new Date().toISOString() })
    return await ctx.db.get(id)
  },
})

export const partialVoid = mutation({
  args: {
    id: v.id("sales"),
    returnItems: v.array(v.object({
      productId: v.id("products"),
      qty: v.number(),
    })),
  },
  handler: async (ctx, { id, returnItems }) => {
    const sale = await ctx.db.get(id)
    if (!sale) throw new Error("Sale not found")
    if (sale.status === "voided") throw new Error("Sale is already voided")

    for (const ri of returnItems) {
      const product = await ctx.db.get(ri.productId)
      if (product) {
        await ctx.db.patch(ri.productId, { stock: product.stock + ri.qty, updatedAt: new Date().toISOString() })
      }
    }

    const updatedItems = sale.items.map((si) => {
      const ret = returnItems.find((ri) => ri.productId === si.productId)
      if (ret) return { ...si, qty: si.qty - ret.qty, total: si.price * (si.qty - ret.qty) }
      return si
    }).filter((si) => si.qty > 0)

    const newTotal = updatedItems.reduce((s, i) => s + i.total, 0)
    const allReturned = updatedItems.length === 0

    await ctx.db.patch(id, {
      items: updatedItems,
      total: newTotal,
      status: allReturned ? "voided" : "partially-returned",
      voidedAt: allReturned ? new Date().toISOString() : sale.voidedAt,
      updatedAt: new Date().toISOString(),
    })
    return await ctx.db.get(id)
  },
})

export const getReceiptSequence = query({
  handler: async (ctx) => {
    const config = await ctx.db.query("config").withIndex("by_key", (q) => q.eq("key", "receiptSequence")).first()
    return config ? Number(config.value) || 0 : 0
  },
})

export const nextReceiptNumber = mutation({
  handler: async (ctx) => {
    const config = await ctx.db.query("config").withIndex("by_key", (q) => q.eq("key", "receiptSequence")).first()
    const current = config ? Number(config.value) || 0 : 0
    const next = current + 1
    const prefix = "R"
    const birConfig = await ctx.db.query("config").withIndex("by_key", (q) => q.eq("key", "birAccreditation")).first()
    let ptuPrefix = ""
    if (birConfig) {
      try {
        const bir = JSON.parse(birConfig.value)
        ptuPrefix = bir.receiptPrefix || ""
      } catch {}
    }
    if (config) {
      await ctx.db.patch(config._id, { value: String(next), updatedAt: new Date().toISOString() })
    } else {
      await ctx.db.insert("config", { key: "receiptSequence", value: String(next), updatedAt: new Date().toISOString() })
    }
    return { number: `${ptuPrefix}${String(next).padStart(8, "0")}`, sequence: next }
  },
})
