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
    unitValue: v.optional(v.number()),
    unit: v.optional(v.string()),
    image: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_sku", ["sku"]),

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
    tax: v.optional(v.number()),
    taxRate: v.optional(v.number()),
    promoCode: v.optional(v.string()),
    orderType: v.string(),
    tableId: v.optional(v.string()),
    transactionId: v.optional(v.string()),
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

  auditLogs: defineTable({
    userId: v.optional(v.string()),
    username: v.string(),
    action: v.string(),
    details: v.optional(v.string()),
    ip: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_createdAt", ["createdAt"]),

  permissions: defineTable({
    role: v.string(),
    page: v.string(),
    canRead: v.boolean(),
    canWrite: v.boolean(),
    canExecute: v.boolean(),
    updatedAt: v.string(),
  }).index("by_role", ["role"]).index("by_role_page", ["role", "page"]),

  config: defineTable({
    key: v.string(),
    value: v.string(),
    updatedAt: v.string(),
  }).index("by_key", ["key"]),

  purchaseOrders: defineTable({
    supplierId: v.id("suppliers"),
    supplierName: v.string(),
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      qty: v.number(),
      unitCost: v.number(),
      total: v.number(),
    })),
    subtotal: v.number(),
    status: v.union(v.literal("pending"), v.literal("ordered"), v.literal("received"), v.literal("cancelled")),
    notes: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.string(),
    updatedAt: v.string(),
  }),

  expenses: defineTable({
    description: v.string(),
    amount: v.number(),
    category: v.string(),
    paymentMethod: v.string(),
    reference: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.string(),
  }).index("by_createdAt", ["createdAt"]),

  promoCodes: defineTable({
    code: v.string(),
    discountType: v.union(v.literal("percentage"), v.literal("fixed")),
    discountValue: v.number(),
    minPurchase: v.optional(v.number()),
    maxUses: v.optional(v.number()),
    useCount: v.number(),
    expiresAt: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.string(),
  }).index("by_code", ["code"]),

  tables: defineTable({
    number: v.string(),
    floor: v.string(),
    capacity: v.number(),
    status: v.union(v.literal("available"), v.literal("occupied"), v.literal("reserved"), v.literal("maintenance")),
    currentSaleId: v.optional(v.id("sales")),
    createdAt: v.string(),
    updatedAt: v.string(),
  }),

  notifications: defineTable({
    type: v.string(),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
    read: v.boolean(),
    userId: v.optional(v.id("users")),
    createdAt: v.string(),
  }).index("by_read", ["read"]).index("by_user", ["userId"]),

  supplierProducts: defineTable({
    supplierId: v.id("suppliers"),
    productId: v.id("products"),
    price: v.number(),
    previousPrice: v.optional(v.number()),
    previousPriceDate: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_supplier", ["supplierId"]).index("by_product", ["productId"]),
})
