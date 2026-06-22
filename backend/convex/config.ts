import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("config").collect()
  },
})

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    return await ctx.db.query("config").withIndex("by_key", (q) => q.eq("key", key)).first()
  },
})

export const set = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const existing = await ctx.db.query("config").withIndex("by_key", (q) => q.eq("key", key)).first()
    if (existing) {
      await ctx.db.patch(existing._id, { value, updatedAt: new Date().toISOString() })
      return existing._id
    }
    return await ctx.db.insert("config", { key, value, updatedAt: new Date().toISOString() })
  },
})
