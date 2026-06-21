import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    username: v.string(),
    password: v.string(),
    role: v.union(v.literal("superadmin"), v.literal("admin"), v.literal("cashier")),
    isActive: v.boolean(),
    createdAt: v.string(),
  }).index("by_username", ["username"]),

  categories: defineTable({
    name: v.string(),
    createdAt: v.string(),
  }).index("by_name", ["name"]),

  products: defineTable({
    name: v.string(),
    sku: v.string(),
    price: v.number(),
    cost: v.number(),
    category: v.string(),
    stock: v.number(),
    barcode: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_sku", ["sku"]),

  customers: defineTable({
    name: v.string(),
    phone: v.string(),
    email: v.string(),
    address: v.string(),
    createdAt: v.string(),
  }),

  sales: defineTable({
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      price: v.number(),
      qty: v.number(),
      total: v.number(),
    })),
    total: v.number(),
    discount: v.number(),
    discountType: v.optional(v.string()),
    orderType: v.string(),
    customerId: v.optional(v.id("customers")),
    paymentMethod: v.string(),
    amountPaid: v.number(),
    change: v.number(),
    status: v.string(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.string(),
    voidedAt: v.optional(v.string()),
  }).index("by_createdAt", ["createdAt"]),

  suppliers: defineTable({
    name: v.string(),
    contact: v.string(),
    phone: v.string(),
    email: v.string(),
    address: v.string(),
    createdAt: v.string(),
  }),

  inventoryMovements: defineTable({
    productId: v.id("products"),
    productName: v.string(),
    type: v.union(v.literal("in"), v.literal("out")),
    quantity: v.number(),
    stockBefore: v.number(),
    stockAfter: v.number(),
    reason: v.string(),
    createdAt: v.string(),
  }).index("by_productId", ["productId"]),
})
