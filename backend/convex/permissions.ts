import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

const ALL_PAGES = [
  "Dashboard", "Products", "Categories", "Sales",
  "Inventory", "Reports", "Users", "Suppliers", "Returns",
  "Audit Logs", "Config", "Permissions", "Monitoring",
  "Snapshots", "Analytics", "Purchase Orders", "Expenses",
  "Promo Codes",
]

const DEFAULT_PERMISSIONS = [
  ...ALL_PAGES.map((page) => ({
    role: "admin",
    page,
    canRead: true,
    canWrite: !["Dashboard", "Sales", "Reports", "Audit Logs", "Permissions", "Monitoring", "Analytics"].includes(page),
    canExecute: !["Dashboard", "Inventory", "Reports", "Returns", "Audit Logs", "Config", "Permissions", "Monitoring", "Snapshots", "Analytics"].includes(page),
  })),
]

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("permissions").collect()
  },
})

export const getByRole = query({
  args: { role: v.string() },
  handler: async (ctx, { role }) => {
    return await ctx.db.query("permissions").withIndex("by_role", (q) => q.eq("role", role)).collect()
  },
})

export const getByRoleAndPage = query({
  args: { role: v.string(), page: v.string() },
  handler: async (ctx, { role, page }) => {
    return await ctx.db.query("permissions").withIndex("by_role_page", (q) => q.eq("role", role).eq("page", page)).first()
  },
})

export const set = mutation({
  args: {
    role: v.string(),
    page: v.string(),
    canRead: v.boolean(),
    canWrite: v.boolean(),
    canExecute: v.boolean(),
  },
  handler: async (ctx, { role, page, canRead, canWrite, canExecute }) => {
    const existing = await ctx.db.query("permissions").withIndex("by_role_page", (q) => q.eq("role", role).eq("page", page)).first()
    const now = new Date().toISOString()
    if (existing) {
      await ctx.db.patch(existing._id, { canRead, canWrite, canExecute, updatedAt: now })
      return existing._id
    }
    return await ctx.db.insert("permissions", { role, page, canRead, canWrite, canExecute, updatedAt: now })
  },
})

export const seedDefaults = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("permissions").first()
    if (existing) return { seeded: false, message: "Permissions already exist" }

    const now = new Date().toISOString()
    for (const p of DEFAULT_PERMISSIONS) {
      await ctx.db.insert("permissions", { ...p, updatedAt: now })
    }
    return { seeded: true, count: DEFAULT_PERMISSIONS.length }
  },
})
