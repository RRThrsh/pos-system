import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect()
  },
})

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const existing = await ctx.db.query("categories").withIndex("by_name", (q) => q.eq("name", name)).first()
    if (existing) throw new Error("Category already exists")
    return await ctx.db.insert("categories", { name, createdAt: new Date().toISOString() })
  },
})

export const update = mutation({
  args: { id: v.id("categories"), name: v.string() },
  handler: async (ctx, { id, name }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Category not found")
    const duplicate = await ctx.db.query("categories").withIndex("by_name", (q) => q.eq("name", name)).first()
    if (duplicate && duplicate._id !== id) throw new Error("Category already exists")
    await ctx.db.patch(id, { name })
    return await ctx.db.get(id)
  },
})

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Category not found")
    await ctx.db.delete(id)
  },
})
