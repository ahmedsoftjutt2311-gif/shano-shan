-- Production integrity hardening.
ALTER TABLE orders ADD COLUMN inventory_restored_at TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_inventory_restored ON orders(inventory_restored_at);
