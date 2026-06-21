-- POS System Database Schema (Convex)
-- Last updated: 2026-06-21
-- Migration: Added suppliers, discount/orderType to sales

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
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_products_sku ON products(sku);

-- =============================================
-- Customers
-- =============================================
CREATE TABLE customers (
    _id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL
);

-- =============================================
-- Sales
-- =============================================
CREATE TABLE sales (
    _id TEXT PRIMARY KEY,
    total REAL NOT NULL,
    discount REAL NOT NULL DEFAULT 0,
    discountType TEXT DEFAULT 'fixed',
    orderType TEXT NOT NULL DEFAULT 'dine-in',
    customerId TEXT REFERENCES customers(_id),
    paymentMethod TEXT NOT NULL DEFAULT 'cash',
    amountPaid REAL NOT NULL,
    change REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
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
    total REAL NOT NULL
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
-- Migration History
-- =============================================
-- v1  - Initial schema: users, categories, products, customers, sales, inventory_movements
-- v2  - Added suppliers table
-- v3  - Added discount, discountType, orderType columns to sales
