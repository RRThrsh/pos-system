import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("paymentMethods").collect()
  },
})

export const create = mutation({
  args: { name: v.string(), description: v.optional(v.string()), isActive: v.boolean() },
  handler: async (ctx, { name, description, isActive }) => {
    const existing = await ctx.db.query("paymentMethods").withIndex("by_name", (q) => q.eq("name", name)).first()
    if (existing) throw new Error("Payment method already exists")
    const now = new Date().toISOString()
    return await ctx.db.insert("paymentMethods", { name, description, isActive, createdAt: now, updatedAt: now })
  },
})

export const update = mutation({
  args: { id: v.id("paymentMethods"), name: v.string(), description: v.optional(v.string()), isActive: v.boolean() },
  handler: async (ctx, { id, name, description, isActive }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Payment method not found")
    const duplicate = await ctx.db.query("paymentMethods").withIndex("by_name", (q) => q.eq("name", name)).first()
    if (duplicate && duplicate._id !== id) throw new Error("Payment method already exists")
    await ctx.db.patch(id, { name, description, isActive, updatedAt: new Date().toISOString() })
    return await ctx.db.get(id)
  },
})

export const remove = mutation({
  args: { id: v.id("paymentMethods") },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Payment method not found")
    await ctx.db.delete(id)
  },
})
