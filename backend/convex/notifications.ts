import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

export const list = query({
  args: { userId: v.optional(v.id("users")), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, limit = 20 }) => {
    let notifications = userId
      ? await ctx.db.query("notifications").withIndex("by_user", (q) => q.eq("userId", userId)).collect()
      : await ctx.db.query("notifications").collect()
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return notifications.slice(0, limit)
  },
})

export const countUnread = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, { userId }) => {
    const all = await ctx.db.query("notifications").withIndex("by_read", (q) => q.eq("read", false)).collect()
    if (userId) return all.filter((n) => !n.userId || n.userId === userId).length
    return all.filter((n) => !n.userId).length
  },
})

export const create = mutation({
  args: { type: v.string(), title: v.string(), message: v.string(), link: v.optional(v.string()), userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", { ...args, read: false, createdAt: new Date().toISOString() })
  },
})

export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { read: true })
  },
})

export const markAllRead = mutation({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, { userId }) => {
    const all = await ctx.db.query("notifications").collect()
    for (const n of all) {
      if (!n.userId || n.userId === userId) await ctx.db.patch(n._id, { read: true })
    }
  },
})
