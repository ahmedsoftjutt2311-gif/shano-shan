ALTER TABLE products ADD COLUMN min_quantity INTEGER NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN max_quantity INTEGER NOT NULL DEFAULT 99;
ALTER TABLE product_variants ADD COLUMN active INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS product_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  viewer_key TEXT NOT NULL,
  viewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(product_id, viewer_key)
);
CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_date ON product_views(viewed_at);

CREATE TABLE IF NOT EXISTS delivery_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  min_qty INTEGER NOT NULL,
  max_qty INTEGER,
  fee INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS payment_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  account_title TEXT,
  account_number TEXT,
  phone_number TEXT,
  bank_name TEXT,
  iban TEXT,
  instructions TEXT,
  qr_public_id TEXT,
  qr_url TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS document_templates (
  type TEXT PRIMARY KEY,
  config TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS order_sequence (
  id INTEGER PRIMARY KEY CHECK(id=1),
  prefix TEXT NOT NULL DEFAULT 'SS-',
  next_number INTEGER NOT NULL DEFAULT 1001
);
INSERT OR IGNORE INTO order_sequence(id,prefix,next_number) VALUES(1,'SS-',1001);
CREATE INDEX IF NOT EXISTS idx_reviews_product_user ON reviews(product_id,user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

INSERT OR IGNORE INTO payment_methods(name,active,display_order) VALUES('Cash on Delivery',1,1),('EasyPaisa',0,2),('JazzCash',0,3),('Bank Transfer',0,4);
INSERT OR IGNORE INTO payment_methods(name,account_title,account_number,instructions,active,display_order) SELECT 'Manual Online Payment',value,(SELECT value FROM settings WHERE key='manual_payment_account_number'),(SELECT value FROM settings WHERE key='manual_payment_instructions'),CASE WHEN value='1' THEN 1 ELSE 0 END,5 FROM settings WHERE key='manual_payment_enabled';
