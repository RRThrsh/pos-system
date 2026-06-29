import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

export const list = query({
  handler: async (ctx) => {
    const codes = await ctx.db.query("promoCodes").collect()
    codes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return codes
  },
})

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    return await ctx.db.query("promoCodes").withIndex("by_code", (q) => q.eq("code", code.toUpperCase())).first()
  },
})

export const create = mutation({
  args: {
    code: v.string(),
    discountType: v.union(v.literal("percentage"), v.literal("fixed")),
    discountValue: v.number(),
    minPurchase: v.optional(v.number()),
    maxUses: v.optional(v.number()),
    expiresAt: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const upper = args.code.toUpperCase()
    const existing = await ctx.db.query("promoCodes").withIndex("by_code", (q) => q.eq("code", upper)).first()
    if (existing) throw new Error("Promo code already exists")
    return await ctx.db.insert("promoCodes", { ...args, code: upper, useCount: 0, isActive: true, createdAt: new Date().toISOString() })
  },
})

export const toggleActive = mutation({
  args: { id: v.id("promoCodes"), isActive: v.boolean() },
  handler: async (ctx, { id, isActive }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Promo code not found")
    await ctx.db.patch(id, { isActive })
    return await ctx.db.get(id)
  },
})

export const incrementUseCount = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const promo = await ctx.db.query("promoCodes").withIndex("by_code", (q) => q.eq("code", code.toUpperCase())).first()
    if (!promo) return
    await ctx.db.patch(promo._id, { useCount: (promo.useCount || 0) + 1 })
  },
})

export const remove = mutation({
  args: { id: v.id("promoCodes") },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Promo code not found")
    await ctx.db.delete(id)
  },
})
