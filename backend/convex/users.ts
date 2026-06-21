import { v } from "convex/values"
import { query, mutation } from "./_generated/server"
import { Doc, Id } from "./_generated/dataModel"

export const list = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect()
    return users.map(({ password, ...u }) => u)
  },
})

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id)
  },
})

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    return await ctx.db.query("users").withIndex("by_username", (q) => q.eq("username", username)).first()
  },
})

export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    username: v.string(),
    password: v.string(),
    role: v.union(v.literal("superadmin"), v.literal("admin"), v.literal("cashier")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("users").withIndex("by_username", (q) => q.eq("username", args.username)).first()
    if (existing) throw new Error("Username already exists")
    return await ctx.db.insert("users", {
      firstName: args.firstName,
      lastName: args.lastName,
      username: args.username,
      password: args.password,
      role: args.role,
      isActive: args.isActive ?? true,
      createdAt: new Date().toISOString(),
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    role: v.optional(v.union(v.literal("superadmin"), v.literal("admin"), v.literal("cashier"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("User not found")
    await ctx.db.patch(id, fields)
    return await ctx.db.get(id)
  },
})

export const remove = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("User not found")
    await ctx.db.delete(id)
  },
})
