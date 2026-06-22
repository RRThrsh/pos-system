-- POS System Database Schema (Convex)
-- Last updated: 2026-06-22
-- Migration: Full retail POS expansion — BIR compliance, reorder mgmt, price history,
--            P&L/slow-moving reports, bulk price, stock counts, partial PO receiving,
--            customers re-added, full backup, configurable shortcuts, tables, notifications

-- =============================================
-- Users
-- =============================================
CREATE TABLE users (
    _id TEXT PRIMARY KEY,
    firstName TEXT,
    lastName TEXT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'cashier')),
    isActive INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- =============================================
-- Categories
-- =============================================
CREATE TABLE categories (
    _id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    createdAt TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_categories_name ON categories(name);

-- =============================================
-- Products
-- =============================================
CREATE TABLE products (
    _id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    price REAL NOT NULL,
    cost REAL NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'Uncategorized',
    stock INTEGER NOT NULL DEFAULT 0,
    barcode TEXT NOT NULL DEFAULT '',
    unitValue REAL,
    unit TEXT,
    image TEXT,                              -- product image URL
    minStock INTEGER,                        -- minimum stock level
    maxStock INTEGER,                        -- maximum stock level
    reorderPoint INTEGER,                    -- stock level at which to reorder
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_products_sku ON products(sku);

-- =============================================
-- Customers (re-added)
-- =============================================
CREATE TABLE customers (
    _id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    birthdate TEXT,
    totalSpent REAL NOT NULL DEFAULT 0,
    visitCount INTEGER NOT NULL DEFAULT 0,
    lastVisit TEXT,
    loyaltyPoints INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);

-- =============================================
-- Sales (BIR-compliant)
-- =============================================
CREATE TABLE sales (
    _id TEXT PRIMARY KEY,
    total REAL NOT NULL,
    discount REAL NOT NULL DEFAULT 0,
    discountType TEXT DEFAULT 'fixed',
    tax REAL,                               -- computed tax amount
    taxRate REAL,                           -- tax percentage applied
    promoCode TEXT,                         -- applied promo code
    orderType TEXT NOT NULL DEFAULT 'walk-in',
    tableId TEXT,                           -- for dine-in orders
    transactionId TEXT,
    receiptNumber TEXT,                     -- BIR OR serial number
    paymentMethod TEXT NOT NULL DEFAULT 'cash',
    amountPaid REAL NOT NULL,
    change REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    customerId TEXT REFERENCES customers(_id),
    customerName TEXT,                      -- snapshot for receipt
    customerPhone TEXT,                     -- snapshot for receipt
    buyerTin TEXT,                          -- BIR buyer TIN
    notes TEXT,                             -- transaction notes
    createdBy TEXT REFERENCES users(_id),
    createdAt TEXT NOT NULL,
    voidedAt TEXT
);
CREATE INDEX idx_sales_createdAt ON sales(createdAt);

CREATE TABLE sale_items (
    _id TEXT PRIMARY KEY,
    saleId TEXT NOT NULL REFERENCES sales(_id) ON DELETE CASCADE,
    productId TEXT NOT NULL REFERENCES products(_id),
    productName TEXT NOT NULL,
    price REAL NOT NULL,
    qty INTEGER NOT NULL,
    total REAL NOT NULL,
    notes TEXT                               -- per-item notes
);

-- =============================================
-- Suppliers
-- =============================================
CREATE TABLE suppliers (
    _id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL
);

-- =============================================
-- Inventory Movements
-- =============================================
CREATE TABLE inventory_movements (
    _id TEXT PRIMARY KEY,
    productId TEXT NOT NULL REFERENCES products(_id),
    productName TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('in', 'out')),
    quantity INTEGER NOT NULL,
    stockBefore INTEGER NOT NULL,
    stockAfter INTEGER NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL
);
CREATE INDEX idx_inventory_productId ON inventory_movements(productId);

-- =============================================
-- Supplier Products (price tracking)
-- =============================================
CREATE TABLE supplier_products (
    _id TEXT PRIMARY KEY,
    supplierId TEXT NOT NULL REFERENCES suppliers(_id),
    productId TEXT NOT NULL REFERENCES products(_id),
    price REAL NOT NULL,
    previousPrice REAL,
    previousPriceDate TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);
CREATE INDEX idx_sp_supplier ON supplier_products(supplierId);
CREATE INDEX idx_sp_product ON supplier_products(productId);

-- =============================================
-- Price History (auto-logged on price/cost change)
-- =============================================
CREATE TABLE price_history (
    _id TEXT PRIMARY KEY,
    productId TEXT NOT NULL REFERENCES products(_id),
    oldPrice REAL NOT NULL,
    newPrice REAL NOT NULL,
    oldCost REAL,
    newCost REAL,
    changedBy TEXT REFERENCES users(_id),
    reason TEXT,
    createdAt TEXT NOT NULL
);
CREATE INDEX idx_price_history_product ON price_history(productId);

-- =============================================
-- Purchase Orders (with partial receiving)
-- =============================================
CREATE TABLE purchase_orders (
    _id TEXT PRIMARY KEY,
    supplierId TEXT NOT NULL REFERENCES suppliers(_id),
    supplierName TEXT NOT NULL,
    subtotal REAL NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'ordered', 'partially-received', 'received', 'cancelled')),
    notes TEXT,
    createdBy TEXT REFERENCES users(_id),
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);

CREATE TABLE po_items (
    _id TEXT PRIMARY KEY,
    poId TEXT NOT NULL REFERENCES purchase_orders(_id) ON DELETE CASCADE,
    productId TEXT NOT NULL REFERENCES products(_id),
    productName TEXT NOT NULL,
    qty INTEGER NOT NULL,
    receivedQty INTEGER NOT NULL DEFAULT 0,  -- track partial receipts
    unitCost REAL NOT NULL,
    total REAL NOT NULL
);

-- =============================================
-- Expenses
-- =============================================
CREATE TABLE expenses (
    _id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    paymentMethod TEXT NOT NULL,
    reference TEXT,
    createdBy TEXT REFERENCES users(_id),
    createdAt TEXT NOT NULL
);
CREATE INDEX idx_expenses_createdAt ON expenses(createdAt);

-- =============================================
-- Promo Codes
-- =============================================
CREATE TABLE promo_codes (
    _id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    discountType TEXT NOT NULL CHECK (discountType IN ('percentage', 'fixed')),
    discountValue REAL NOT NULL,
    minPurchase REAL,
    maxUses INTEGER,
    useCount INTEGER NOT NULL DEFAULT 0,
    expiresAt TEXT,
    isActive INTEGER NOT NULL DEFAULT 1,
    createdBy TEXT REFERENCES users(_id),
    createdAt TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_promo_code ON promo_codes(code);

-- =============================================
-- Tables (dine-in)
-- =============================================
CREATE TABLE tables (
    _id TEXT PRIMARY KEY,
    number TEXT NOT NULL,
    floor TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
    currentSaleId TEXT REFERENCES sales(_id),
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);

-- =============================================
-- Notifications
-- =============================================
CREATE TABLE notifications (
    _id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read INTEGER NOT NULL DEFAULT 0,
    userId TEXT REFERENCES users(_id),
    createdAt TEXT NOT NULL
);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_user ON notifications(userId);

-- =============================================
-- Held Orders
-- =============================================
CREATE TABLE held_orders (
    _id TEXT PRIMARY KEY,
    subtotal REAL NOT NULL,
    notes TEXT,
    createdBy TEXT REFERENCES users(_id),
    createdAt TEXT NOT NULL
);

CREATE TABLE held_order_items (
    _id TEXT PRIMARY KEY,
    heldOrderId TEXT NOT NULL REFERENCES held_orders(_id) ON DELETE CASCADE,
    productId TEXT NOT NULL,
    productName TEXT NOT NULL,
    price REAL NOT NULL,
    qty INTEGER NOT NULL,
    total REAL NOT NULL
);

-- =============================================
-- Stock Counts (physical inventory audit)
-- =============================================
CREATE TABLE stock_counts (
    _id TEXT PRIMARY KEY,
    productId TEXT NOT NULL REFERENCES products(_id),
    productName TEXT NOT NULL,
    expectedStock INTEGER NOT NULL,
    actualStock INTEGER NOT NULL,
    variance INTEGER NOT NULL,
    countedBy TEXT REFERENCES users(_id),
    notes TEXT,
    createdAt TEXT NOT NULL
);
CREATE INDEX idx_stock_counts_product ON stock_counts(productId);

-- =============================================
-- Config
-- =============================================
CREATE TABLE config (
    _id TEXT PRIMARY KEY,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_config_key ON config(key);

-- =============================================
-- Permissions (role-based access)
-- =============================================
CREATE TABLE permissions (
    _id TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    page TEXT NOT NULL,
    canRead INTEGER NOT NULL DEFAULT 0,
    canWrite INTEGER NOT NULL DEFAULT 0,
    canExecute INTEGER NOT NULL DEFAULT 0,
    updatedAt TEXT NOT NULL
);
CREATE INDEX idx_permissions_role ON permissions(role);
CREATE UNIQUE INDEX idx_permissions_role_page ON permissions(role, page);

-- =============================================
-- Audit Logs
-- =============================================
CREATE TABLE audit_logs (
    _id TEXT PRIMARY KEY,
    userId TEXT REFERENCES users(_id),
    username TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT DEFAULT '',
    ip TEXT DEFAULT '',
    createdAt TEXT NOT NULL
);
CREATE INDEX idx_audit_createdAt ON audit_logs(createdAt);

-- =============================================
-- Migration History
-- =============================================
-- v1  - Initial schema: users, categories, products, customers, sales, inventory_movements
-- v2  - Added suppliers table
-- v3  - Added discount, discountType, orderType columns to sales
-- v4  - Added unitValue, unit columns to products
-- v5  - Removed customers table
-- v6  - Added supplier_products table with price history tracking
-- v7  - Replaced customerId with transactionId on sales table
-- v8  - Added audit_logs table for user activity tracking
-- v9  - Added config, permissions tables
-- v10 - Added purchase_orders table for supplier ordering
-- v11 - Added expenses table for operational expense tracking
-- v12 - Added promo_codes table for reusable discount codes
-- v13 - Added tables (dine-in), notifications
-- v14 - Re-added customers with loyalty points, visit tracking
-- v15 - Added price_history table, minStock/maxStock/reorderPoint on products,
--       image on products, tax/taxRate/promoCode/receiptNumber on sales,
--       customerId/customerName/customerPhone/buyerTin/notes on sales,
--       per-item notes on sale_items, receivedQty on po_items,
--       partially-received PO status, held_orders + held_order_items,
--       stock_counts, configurable shortcuts (stored in config table)
