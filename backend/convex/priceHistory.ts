import { v } from "convex/values"
import { query } from "./_generated/server"

export const list = query({
  args: {
    productId: v.optional(v.id("products")),
  },
  handler: async (ctx, { productId }) => {
    let history = await ctx.db.query("priceHistory").collect()
    if (productId) history = history.filter((h) => h.productId === productId)
    history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return history
  },
})

export const getById = query({
  args: { id: v.id("priceHistory") },
  handler: async (ctx, { id }) => await ctx.db.get(id),
})
