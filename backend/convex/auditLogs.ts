import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

export const list = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    action: v.optional(v.string()),
    userId: v.optional(v.string()),
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
  },
  handler: async (ctx, { limit = 50, offset = 0, action, userId, dateFrom, dateTo }) => {
    let logs = await ctx.db.query("auditLogs").collect()

    if (action) logs = logs.filter((l) => l.action === action)
    if (userId) logs = logs.filter((l) => l.userId === userId)
    if (dateFrom) logs = logs.filter((l) => l.createdAt >= dateFrom)
    if (dateTo) logs = logs.filter((l) => l.createdAt <= dateTo)

    logs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    return {
      data: logs.slice(offset, offset + limit),
      total: logs.length,
    }
  },
})

export const clearAll = mutation({
  handler: async (ctx) => {
    const logs = await ctx.db.query("auditLogs").collect()
    for (const log of logs) {
      await ctx.db.delete(log._id)
    }
  },
})

export const create = mutation({
  args: {
    userId: v.optional(v.string()),
    username: v.string(),
    action: v.string(),
    details: v.optional(v.string()),
    ip: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditLogs", {
      userId: args.userId ?? undefined,
      username: args.username,
      action: args.action,
      details: args.details ?? "",
      ip: args.ip ?? "",
      createdAt: new Date().toISOString(),
    })
  },
})
