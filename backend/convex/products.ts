import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

export const list = query({
  args: {
    category: v.optional(v.string()),
    search: v.optional(v.string()),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { category, search, page = 1, limit = 20 }) => {
    let products = await ctx.db.query("products").collect()

    if (category) products = products.filter((p) => p.category.toLowerCase() === category.toLowerCase())
    if (search) {
      const q = search.toLowerCase()
      products = products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    }

    const start = (page - 1) * limit
    const end = start + limit
    return {
      data: products.slice(start, end),
      total: products.length,
      page,
      limit,
      totalPages: Math.ceil(products.length / limit),
    }
  },
})

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id)
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    sku: v.string(),
    price: v.number(),
    cost: v.optional(v.number()),
    category: v.optional(v.string()),
    stock: v.optional(v.number()),
    barcode: v.optional(v.string()),
    unitValue: v.optional(v.number()),
    unit: v.optional(v.string()),
    image: v.optional(v.string()),
    minStock: v.optional(v.number()),
    maxStock: v.optional(v.number()),
    reorderPoint: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("products").withIndex("by_sku", (q) => q.eq("sku", args.sku)).first()
    if (existing) throw new Error("SKU already exists")

    const now = new Date().toISOString()
    return await ctx.db.insert("products", {
      name: args.name,
      sku: args.sku,
      price: args.price,
      cost: args.cost ?? 0,
      category: args.category ?? "Uncategorized",
      stock: args.stock ?? 0,
      barcode: args.barcode ?? "",
      unitValue: args.unitValue,
      unit: args.unit,
      image: args.image,
      minStock: args.minStock,
      maxStock: args.maxStock,
      reorderPoint: args.reorderPoint,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    sku: v.optional(v.string()),
    price: v.optional(v.number()),
    cost: v.optional(v.number()),
    category: v.optional(v.string()),
    stock: v.optional(v.number()),
    barcode: v.optional(v.string()),
    unitValue: v.optional(v.number()),
    unit: v.optional(v.string()),
    image: v.optional(v.string()),
    minStock: v.optional(v.number()),
    maxStock: v.optional(v.number()),
    reorderPoint: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Product not found")

    if (fields.sku && fields.sku !== existing.sku) {
      const dup = await ctx.db.query("products").withIndex("by_sku", (q) => q.eq("sku", fields.sku!)).first()
      if (dup) throw new Error("SKU already exists")
    }

    if ((fields.price !== undefined && fields.price !== existing.price) || (fields.cost !== undefined && fields.cost !== existing.cost)) {
      await ctx.db.insert("priceHistory", {
        productId: id,
        oldPrice: existing.price,
        newPrice: fields.price ?? existing.price,
        oldCost: fields.cost !== undefined ? existing.cost : undefined,
        newCost: fields.cost !== undefined ? fields.cost : undefined,
        changedBy: fields.createdBy,
        reason: fields.price !== existing.price ? "Manual price update" : "Manual cost update",
        createdAt: new Date().toISOString(),
      })
    }

    await ctx.db.patch(id, { ...fields, updatedAt: new Date().toISOString() })
    return await ctx.db.get(id)
  },
})

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Product not found")
    await ctx.db.delete(id)
  },
})

export const bulkUpdatePrice = mutation({
  args: {
    productIds: v.array(v.id("products")),
    price: v.optional(v.number()),
    cost: v.optional(v.number()),
    percentageAdjustment: v.optional(v.number()),
  },
  handler: async (ctx, { productIds, price, cost, percentageAdjustment }) => {
    const now = new Date().toISOString()
    for (const id of productIds) {
      const existing = await ctx.db.get(id)
      if (!existing) continue
      const newPrice = price ?? (percentageAdjustment ? existing.price * (1 + percentageAdjustment / 100) : existing.price)
      const newCost = cost ?? existing.cost
      if (newPrice !== existing.price || newCost !== existing.cost) {
        await ctx.db.insert("priceHistory", {
          productId: id,
          oldPrice: existing.price,
          newPrice,
          oldCost: existing.cost,
          newCost,
          reason: "Bulk update",
          createdAt: now,
        })
      }
      await ctx.db.patch(id, { price: newPrice, cost: newCost, updatedAt: now })
    }
  },
})
