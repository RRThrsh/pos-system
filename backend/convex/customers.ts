import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

export const list = query({
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect()
    customers.sort((a, b) => a.name.localeCompare(b.name))
    return customers
  },
})

export const getById = query({
  args: { id: v.id("customers") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id)
  },
})

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    const all = await ctx.db.query("customers").collect()
    const q = query.toLowerCase()
    return all.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    birthdate: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    return await ctx.db.insert("customers", {
      name: args.name,
      phone: args.phone,
      email: args.email,
      address: args.address,
      birthdate: args.birthdate,
      notes: args.notes,
      totalSpent: 0,
      visitCount: 0,
      lastVisit: undefined,
      loyaltyPoints: 0,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("customers"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    birthdate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, { ...fields, updatedAt: new Date().toISOString() })
    return await ctx.db.get(id)
  },
})

export const remove = mutation({
  args: { id: v.id("customers") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id)
  },
})

export const addLoyaltyPoints = mutation({
  args: { id: v.id("customers"), points: v.number() },
  handler: async (ctx, { id, points }) => {
    const customer = await ctx.db.get(id)
    if (!customer) throw new Error("Customer not found")
    await ctx.db.patch(id, { loyaltyPoints: (customer.loyaltyPoints || 0) + points, updatedAt: new Date().toISOString() })
    return await ctx.db.get(id)
  },
})
