import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

export const list = query({
  args: {
    productId: v.optional(v.id("products")),
    type: v.optional(v.union(v.literal("in"), v.literal("out"))),
  },
  handler: async (ctx, { productId, type }) => {
    let movements = await ctx.db.query("inventoryMovements").collect()
    if (productId) movements = movements.filter((m) => m.productId === productId)
    if (type) movements = movements.filter((m) => m.type === type)
    return movements
  },
})

export const adjust = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    type: v.union(v.literal("in"), v.literal("out")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { productId, quantity, type, reason }) => {
    const product = await ctx.db.get(productId)
    if (!product) throw new Error("Product not found")

    if (type === "out" && product.stock < quantity) throw new Error("Insufficient stock")

    const stockBefore = product.stock
    const stockAfter = type === "in" ? product.stock + quantity : product.stock - quantity

    await ctx.db.patch(productId, { stock: stockAfter, updatedAt: new Date().toISOString() })

    return await ctx.db.insert("inventoryMovements", {
      productId,
      productName: product.name,
      type,
      quantity,
      stockBefore,
      stockAfter,
      reason: reason ?? "",
      createdAt: new Date().toISOString(),
    })
  },
})
