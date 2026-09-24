ALTER TABLE payment_methods ADD COLUMN method_type TEXT NOT NULL DEFAULT 'online';
UPDATE payment_methods SET method_type='cod' WHERE lower(name) LIKE '%cash on delivery%';
INSERT OR IGNORE INTO settings(key,value) VALUES ('cod_delivery_advance','0');
CREATE TABLE IF NOT EXISTS receipt_uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  public_id TEXT NOT NULL,
  secure_url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_receipt_uploads_user ON receipt_uploads(user_id);
