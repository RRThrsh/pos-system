import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

export const list = query({
  args: {
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
    category: v.optional(v.string()),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { dateFrom, dateTo, category, page = 1, limit = 20 }) => {
    let expenses = await ctx.db.query("expenses").collect()
    if (dateFrom) expenses = expenses.filter((e) => e.createdAt >= dateFrom)
    if (dateTo) expenses = expenses.filter((e) => e.createdAt <= dateTo)
    if (category) expenses = expenses.filter((e) => e.category === category)
    expenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const start = (page - 1) * limit
    return { data: expenses.slice(start, start + limit), total: expenses.length, page, limit, totalPages: Math.ceil(expenses.length / limit) }
  },
})

export const create = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    category: v.string(),
    paymentMethod: v.string(),
    reference: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("expenses", { ...args, createdAt: new Date().toISOString() })
  },
})

export const remove = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Expense not found")
    await ctx.db.delete(id)
  },
})
