import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

export const list = query({
  args: {
    search: v.optional(v.string()),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { search, page = 1, limit = 20 }) => {
    let customers = await ctx.db.query("customers").collect()

    if (search) {
      const q = search.toLowerCase()
      customers = customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
    }

    const start = (page - 1) * limit
    const end = start + limit
    return {
      data: customers.slice(start, end),
      total: customers.length,
      page,
      limit,
      totalPages: Math.ceil(customers.length / limit),
    }
  },
})

export const getById = query({
  args: { id: v.id("customers") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id)
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("customers", {
      name: args.name,
      phone: args.phone ?? "",
      email: args.email ?? "",
      address: args.address ?? "",
      createdAt: new Date().toISOString(),
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
  },
  handler: async (ctx, { id, ...fields }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Customer not found")
    await ctx.db.patch(id, fields)
    return await ctx.db.get(id)
  },
})

export const remove = mutation({
  args: { id: v.id("customers") },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Customer not found")
    await ctx.db.delete(id)
  },
})
