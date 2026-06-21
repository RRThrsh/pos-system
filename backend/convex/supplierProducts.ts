import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

export const listBySupplier = query({
  args: { supplierId: v.id("suppliers") },
  handler: async (ctx, { supplierId }) => {
    const items = await ctx.db
      .query("supplierProducts")
      .withIndex("by_supplier", (q) => q.eq("supplierId", supplierId))
      .collect()

    const enriched = await Promise.all(
      items.map(async (sp) => {
        const product = await ctx.db.get(sp.productId)
        return {
          ...sp,
          productName: product?.name ?? "Unknown",
          productSku: product?.sku ?? "",
        }
      })
    )

    return enriched
  },
})

export const listByProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const items = await ctx.db
      .query("supplierProducts")
      .withIndex("by_product", (q) => q.eq("productId", productId))
      .collect()

    const enriched = await Promise.all(
      items.map(async (sp) => {
        const supplier = await ctx.db.get(sp.supplierId)
        return {
          ...sp,
          supplierName: supplier?.name ?? "Unknown",
        }
      })
    )

    return enriched
  },
})

export const set = mutation({
  args: {
    supplierId: v.id("suppliers"),
    productId: v.id("products"),
    price: v.number(),
  },
  handler: async (ctx, { supplierId, productId, price }) => {
    const existing = await ctx.db
      .query("supplierProducts")
      .withIndex("by_supplier", (q) => q.eq("supplierId", supplierId))
      .collect()

    const match = existing.find((sp) => sp.productId === productId)
    const now = new Date().toISOString()

    if (match) {
      const previousPrice = match.price
      await ctx.db.patch(match._id, {
        price,
        previousPrice,
        previousPriceDate: now,
        updatedAt: now,
      })
      return await ctx.db.get(match._id)
    }

    const id = await ctx.db.insert("supplierProducts", {
      supplierId,
      productId,
      price,
      previousPrice: undefined,
      previousPriceDate: undefined,
      createdAt: now,
      updatedAt: now,
    })

    return await ctx.db.get(id)
  },
})
