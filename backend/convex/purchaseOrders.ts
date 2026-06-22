import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

export const list = query({
  args: {
    status: v.optional(v.string()),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, page = 1, limit = 20 }) => {
    let orders = await ctx.db.query("purchaseOrders").collect()
    if (status) orders = orders.filter((o) => o.status === status)
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const start = (page - 1) * limit
    return { data: orders.slice(start, start + limit), total: orders.length, page, limit, totalPages: Math.ceil(orders.length / limit) }
  },
})

export const getById = query({
  args: { id: v.id("purchaseOrders") },
  handler: async (ctx, { id }) => await ctx.db.get(id),
})

export const create = mutation({
  args: {
    supplierId: v.id("suppliers"),
    supplierName: v.string(),
    items: v.array(v.object({ productId: v.id("products"), productName: v.string(), qty: v.number(), unitCost: v.number(), total: v.number() })),
    subtotal: v.number(),
    notes: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    const itemsWithReceived = args.items.map((i) => ({ ...i, receivedQty: 0 }))
    return await ctx.db.insert("purchaseOrders", { ...args, items: itemsWithReceived, status: "pending", createdAt: now, updatedAt: now })
  },
})

export const updateStatus = mutation({
  args: { id: v.id("purchaseOrders"), status: v.union(v.literal("pending"), v.literal("ordered"), v.literal("received"), v.literal("cancelled")) },
  handler: async (ctx, { id, status }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Purchase order not found")
    if (status === "received") {
      for (const item of existing.items) {
        const product = await ctx.db.get(item.productId)
        if (product) {
          const remaining = item.qty - (item.receivedQty || 0)
          if (remaining > 0) {
            await ctx.db.patch(item.productId, { stock: product.stock + remaining, updatedAt: new Date().toISOString() })
          }
        }
      }
    }
    await ctx.db.patch(id, { status, updatedAt: new Date().toISOString() })
    return await ctx.db.get(id)
  },
})

export const partialReceive = mutation({
  args: {
    id: v.id("purchaseOrders"),
    receiveItems: v.array(v.object({
      productId: v.id("products"),
      qty: v.number(),
    })),
  },
  handler: async (ctx, { id, receiveItems }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Purchase order not found")
    if (existing.status === "received" || existing.status === "cancelled") throw new Error("Order already completed or cancelled")

    const updatedItems = existing.items.map((item) => {
      const ri = receiveItems.find((r) => r.productId === item.productId)
      if (ri) {
        const currentReceived = item.receivedQty || 0
        const newReceived = Math.min(currentReceived + ri.qty, item.qty)
        const toAdd = ri.qty
        return { ...item, receivedQty: newReceived }
      }
      return item
    })

    for (const ri of receiveItems) {
      const product = await ctx.db.get(ri.productId)
      if (product) {
        await ctx.db.patch(ri.productId, { stock: product.stock + ri.qty, updatedAt: new Date().toISOString() })
      }
    }

    const allReceived = updatedItems.every((item) => (item.receivedQty || 0) >= item.qty)
    const anyReceived = updatedItems.some((item) => (item.receivedQty || 0) > 0)
    const newStatus = allReceived ? "received" : anyReceived ? "partially-received" : existing.status

    await ctx.db.patch(id, { items: updatedItems, status: newStatus, updatedAt: new Date().toISOString() })
    return await ctx.db.get(id)
  },
})

export const remove = mutation({
  args: { id: v.id("purchaseOrders") },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Purchase order not found")
    await ctx.db.delete(id)
  },
})
