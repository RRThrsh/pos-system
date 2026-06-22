import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

export const list = query({
  handler: async (ctx) => {
    const counts = await ctx.db.query("stockCounts").collect()
    counts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return counts
  },
})

export const create = mutation({
  args: {
    productId: v.id("products"),
    productName: v.string(),
    expectedStock: v.number(),
    actualStock: v.number(),
    countedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const variance = args.actualStock - args.expectedStock
    return await ctx.db.insert("stockCounts", {
      ...args,
      variance,
      createdAt: new Date().toISOString(),
    })
  },
})

export const remove = mutation({
  args: { id: v.id("stockCounts") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id)
  },
})

export const getById = query({
  args: { id: v.id("stockCounts") },
  handler: async (ctx, { id }) => await ctx.db.get(id),
})
