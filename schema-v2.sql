-- SCHEMA V2 - Optimizado para precisión y configuración dinámica
-- Migración: Turso con transacciones y auditoría ligera

-- ============================================================================
-- CONFIGURACIÓN DE LA TIENDA (reemplaza hardcoded values)
-- ============================================================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at INTEGER DEFAULT (unixepoch()),
  updated_by TEXT -- admin user
);

-- Valores por defecto
INSERT OR IGNORE INTO settings (key, value, description) VALUES
  ('store_mode', 'normal', 'normal|password|soldout|maintenance'),
  ('max_items_per_cart', '5', 'Máximo de items totales por carrito'),
  ('max_items_per_color', '5', 'Máximo de items por color'),
  ('reservation_duration_minutes', '10', 'Duración de reservas en minutos'),
  ('session_duration_minutes', '5', 'Duración de sesión en minutos'),
  ('low_stock_threshold', '3', 'Umbral para alerta de stock bajo'),
  ('telegram_notifications_enabled', 'true', 'Activar notificaciones de Telegram'),
  ('telegram_notify_on_sale', 'true', 'Notificar cuando hay venta'),
  ('telegram_notify_on_stock_out', 'true', 'Notificar cuando producto se agota'),
  ('store_message', '', 'Mensaje personalizado en modo maintenance');

-- ============================================================================
-- PRODUCTOS Y STOCK
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  edition TEXT DEFAULT '001',
  type TEXT DEFAULT 'snapback',
  description TEXT,
  description_en TEXT,
  available INTEGER DEFAULT 1,
  features TEXT, -- Comma separated
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS product_colors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  hex TEXT,
  price INTEGER NOT NULL,
  stock INTEGER DEFAULT 0,
  images TEXT, -- JSON array
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(product_id, name) -- Evita duplicados
);

-- ============================================================================
-- RESERVAS (con limpieza automática)
-- ============================================================================
CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  color TEXT NOT NULL,
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
  items TEXT NOT NULL, -- JSON
  subtotal INTEGER NOT NULL,
  shipping INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending|paid|shipped|cancelled
  payu_reference TEXT,
  shipping_address TEXT, -- JSON
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- ============================================================================
-- AUDITORÍA LIGERA (solo eventos importantes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  color TEXT NOT NULL,
  event_type TEXT NOT NULL, -- sale|restock|manual_adjust|stock_out
  quantity_change INTEGER NOT NULL, -- negativo para ventas, positivo para restock
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  order_id TEXT, -- si es venta
  admin_user TEXT, -- si es cambio manual
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
  type TEXT DEFAULT 'percentage', -- percentage|fixed
  value INTEGER NOT NULL,
  active INTEGER DEFAULT 1,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_reservations_session ON reservations(session_id);
CREATE INDEX IF NOT EXISTS idx_reservations_expires ON reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_reservations_product_color ON reservations(product_id, color);
CREATE INDEX IF NOT EXISTS idx_product_colors_product ON product_colors(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_audit_product ON stock_audit(product_id, color);
CREATE INDEX IF NOT EXISTS idx_stock_audit_created ON stock_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- ============================================================================
-- TRIGGERS PARA AUDITORÍA AUTOMÁTICA
-- ============================================================================

-- Trigger: Auditar cuando stock cambia manualmente
CREATE TRIGGER IF NOT EXISTS audit_stock_change
AFTER UPDATE OF stock ON product_colors
WHEN OLD.stock != NEW.stock
BEGIN
  INSERT INTO stock_audit (product_id, color, event_type, quantity_change, stock_before, stock_after, notes)
  VALUES (NEW.product_id, NEW.name, 'manual_adjust', NEW.stock - OLD.stock, OLD.stock, NEW.stock, 'Stock updated');
  
  -- Notificar si se agotó
  INSERT INTO stock_audit (product_id, color, event_type, quantity_change, stock_before, stock_after, notes)
  SELECT NEW.product_id, NEW.name, 'stock_out', 0, NEW.stock, NEW.stock, 'Product sold out'
  WHERE NEW.stock = 0 AND OLD.stock > 0;
END;

-- Trigger: Actualizar updated_at en products
CREATE TRIGGER IF NOT EXISTS update_products_timestamp
AFTER UPDATE ON products
BEGIN
  UPDATE products SET updated_at = unixepoch() WHERE id = NEW.id;
END;

-- Trigger: Actualizar updated_at en product_colors
CREATE TRIGGER IF NOT EXISTS update_product_colors_timestamp
AFTER UPDATE ON product_colors
BEGIN
  UPDATE product_colors SET updated_at = unixepoch() WHERE id = NEW.id;
END;

-- Trigger: Actualizar updated_at en orders
CREATE TRIGGER IF NOT EXISTS update_orders_timestamp
AFTER UPDATE ON orders
BEGIN
  UPDATE orders SET updated_at = unixepoch() WHERE id = NEW.id;
END;

-- Trigger: Actualizar updated_at en settings
CREATE TRIGGER IF NOT EXISTS update_settings_timestamp
AFTER UPDATE ON settings
BEGIN
  UPDATE settings SET updated_at = unixepoch() WHERE key = NEW.key;
END;
