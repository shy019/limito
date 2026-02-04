-- Schema para Turso DB
-- Base de datos Turso (SQLite)

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  edition TEXT DEFAULT '001',
  type TEXT DEFAULT 'snapback',
  description TEXT,
  description_en TEXT,
  available INTEGER DEFAULT 1,
  colors TEXT, -- JSON array
  features TEXT, -- Comma separated
  created_at INTEGER DEFAULT (unixepoch())
);

-- Tabla de colores/stock (normalizada)
CREATE TABLE IF NOT EXISTS product_colors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  hex TEXT,
  price INTEGER NOT NULL,
  stock INTEGER DEFAULT 0,
  images TEXT, -- JSON array
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Tabla de reservas (reemplaza sheet de reservations)
CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  color TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Tabla de órdenes
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  items TEXT, -- JSON
  subtotal INTEGER,
  shipping INTEGER,
  discount INTEGER DEFAULT 0,
  total INTEGER,
  status TEXT DEFAULT 'pending',
  payu_reference TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Tabla de códigos promo
CREATE TABLE IF NOT EXISTS promo_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'percentage', -- percentage or fixed
  value INTEGER NOT NULL,
  active INTEGER DEFAULT 1,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Tabla de suscripciones de teléfono
CREATE TABLE IF NOT EXISTS phone_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Tabla de configuración (modos de aplicación, passwords, etc)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by TEXT DEFAULT 'system',
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reservations_session ON reservations(session_id);
CREATE INDEX IF NOT EXISTS idx_reservations_expires ON reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_reservations_product ON reservations(product_id, color);
CREATE INDEX IF NOT EXISTS idx_product_colors_product ON product_colors(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_phone_subscriptions_phone ON phone_subscriptions(phone);
