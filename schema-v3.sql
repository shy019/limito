-- SCHEMA V3 - Sin colores, producto simple
-- Migración: Borrar todo y recrear desde cero

-- ============================================================================
-- LIMPIAR TABLAS ANTERIORES
-- ============================================================================
DROP TABLE IF EXISTS stock_audit;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS product_colors;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS promo_codes;
DROP TABLE IF EXISTS phone_subscriptions;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS products;

-- ============================================================================
-- CONFIGURACIÓN DE LA TIENDA
-- ============================================================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at INTEGER DEFAULT (unixepoch()),
  updated_by TEXT
);

INSERT OR IGNORE INTO settings (key, value, description) VALUES
  ('store_mode', 'normal', 'normal|password|soldout|maintenance'),
  ('max_items_per_cart', '5', 'Máximo de items totales por carrito'),
  ('max_items_per_product', '5', 'Máximo de items por producto'),
  ('reservation_duration_minutes', '10', 'Duración de reservas en minutos'),
  ('session_duration_minutes', '5', 'Duración de sesión en minutos'),
  ('low_stock_threshold', '3', 'Umbral para alerta de stock bajo'),
  ('telegram_notifications_enabled', 'true', 'Activar notificaciones de Telegram'),
  ('telegram_notify_on_sale', 'true', 'Notificar cuando hay venta'),
  ('telegram_notify_on_stock_out', 'true', 'Notificar cuando producto se agota'),
  ('store_message', '', 'Mensaje personalizado en modo maintenance'),
  ('background_image', '', 'URL de imagen/video de fondo'),
  ('background_type', 'image', 'Tipo de fondo: image o video'),
  ('static_background_image', '', 'Imagen estática para catalog/cart'),
  ('accent_color', '#D4AF37', 'Color de acento de la tienda'),
  ('password_until', '', 'Fecha límite del modo password');

-- ============================================================================
-- PRODUCTOS (sin colores, todo directo)
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  edition TEXT DEFAULT '001',
  type TEXT DEFAULT 'snapback',
  description TEXT,
  description_en TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  images TEXT,              -- JSON array de URLs
  available INTEGER DEFAULT 1,
  features TEXT,            -- Comma separated
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- ============================================================================
-- RESERVAS (sin color)
-- ============================================================================
CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================================
-- ÓRDENES
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  items TEXT NOT NULL,       -- JSON
  subtotal INTEGER NOT NULL,
  shipping INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  payu_reference TEXT,
  shipping_address TEXT,     -- JSON
  shipping_city TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- ============================================================================
-- AUDITORÍA DE STOCK (sin color)
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  quantity_change INTEGER NOT NULL,
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  order_id TEXT,
  admin_user TEXT,
  notes TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================================
-- CÓDIGOS PROMO
-- ============================================================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'percentage',
  value INTEGER NOT NULL,
  active INTEGER DEFAULT 1,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

-- ============================================================================
-- SUSCRIPCIONES DE TELÉFONO
-- ============================================================================
CREATE TABLE IF NOT EXISTS phone_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_reservations_session ON reservations(session_id);
CREATE INDEX IF NOT EXISTS idx_reservations_expires ON reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_reservations_product ON reservations(product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_product_session ON reservations(product_id, session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_audit_product ON stock_audit(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_audit_created ON stock_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- NOTA: No se usa trigger automático para stock_audit porque confirmSaleInTurso
-- ya inserta manualmente con event_type='sale'. Un trigger duplicaría los registros.

CREATE TRIGGER IF NOT EXISTS update_products_timestamp
AFTER UPDATE ON products
BEGIN
  UPDATE products SET updated_at = unixepoch() WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_orders_timestamp
AFTER UPDATE ON orders
BEGIN
  UPDATE orders SET updated_at = unixepoch() WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_settings_timestamp
AFTER UPDATE ON settings
BEGIN
  UPDATE settings SET updated_at = unixepoch() WHERE key = NEW.key;
END;
