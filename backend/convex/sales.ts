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
    })),
    transactionId: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    amountPaid: v.optional(v.number()),
    discount: v.optional(v.number()),
    discountType: v.optional(v.string()),
    orderType: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, { items, transactionId, paymentMethod, amountPaid, discount, discountType, orderType, createdBy }) => {
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
      })

      await ctx.db.patch(item.productId, { stock: product.stock - item.qty, updatedAt: new Date().toISOString() })
    }

    const disc = discount ?? 0
    const discAmt = discountType === "percentage" ? subtotal * (disc / 100) : disc
    const total = Math.max(0, subtotal - discAmt)
    const change = amountPaid ? amountPaid - total : 0

    return await ctx.db.insert("sales", {
      items: saleItems,
      total,
      discount: discAmt,
      discountType: discountType ?? "fixed",
      orderType: orderType ?? "dine-in",
      transactionId,
      paymentMethod: paymentMethod ?? "cash",
      amountPaid: amountPaid ?? total,
      change: change > 0 ? change : 0,
      status: "completed",
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
