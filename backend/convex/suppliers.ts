import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

export const list = query({
  args: {
    search: v.optional(v.string()),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { search, page = 1, limit = 20 }) => {
    let suppliers = await ctx.db.query("suppliers").collect()

    if (search) {
      const q = search.toLowerCase()
      suppliers = suppliers.filter((s) => s.name.toLowerCase().includes(q) || s.contact?.toLowerCase().includes(q))
    }

    const start = (page - 1) * limit
    const end = start + limit
    return {
      data: suppliers.slice(start, end),
      total: suppliers.length,
      page,
      limit,
      totalPages: Math.ceil(suppliers.length / limit),
    }
  },
})

export const getById = query({
  args: { id: v.id("suppliers") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id)
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    contact: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("suppliers", {
      name: args.name,
      contact: args.contact ?? "",
      phone: args.phone ?? "",
      email: args.email ?? "",
      address: args.address ?? "",
      createdAt: new Date().toISOString(),
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("suppliers"),
    name: v.optional(v.string()),
    contact: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Supplier not found")
    await ctx.db.patch(id, fields)
    return await ctx.db.get(id)
  },
})

export const remove = mutation({
  args: { id: v.id("suppliers") },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Supplier not found")
    await ctx.db.delete(id)
  },
})
