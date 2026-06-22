import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

export const list = query({
  handler: async (ctx) => {
    const orders = await ctx.db.query("heldOrders").collect()
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return orders
  },
})

export const getById = query({
  args: { id: v.id("heldOrders") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id)
  },
})

export const create = mutation({
  args: {
    items: v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      price: v.number(),
      qty: v.number(),
      total: v.number(),
    })),
    subtotal: v.number(),
    notes: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("heldOrders", {
      ...args,
      createdAt: new Date().toISOString(),
    })
  },
})

export const remove = mutation({
  args: { id: v.id("heldOrders") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id)
  },
})
