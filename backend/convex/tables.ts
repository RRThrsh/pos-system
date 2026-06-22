import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

export const list = query({
  handler: async (ctx) => {
    const tables = await ctx.db.query("tables").collect()
    tables.sort((a, b) => a.number.localeCompare(b.number))
    return tables
  },
})

export const create = mutation({
  args: { number: v.string(), floor: v.string(), capacity: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tables", { ...args, status: "available", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  },
})

export const updateStatus = mutation({
  args: { id: v.id("tables"), status: v.union(v.literal("available"), v.literal("occupied"), v.literal("reserved"), v.literal("maintenance")), currentSaleId: v.optional(v.id("sales")) },
  handler: async (ctx, { id, status, currentSaleId }) => {
    await ctx.db.patch(id, { status, currentSaleId, updatedAt: new Date().toISOString() })
    return await ctx.db.get(id)
  },
})

export const remove = mutation({
  args: { id: v.id("tables") },
  handler: async (ctx, { id }) => { await ctx.db.delete(id) },
})
