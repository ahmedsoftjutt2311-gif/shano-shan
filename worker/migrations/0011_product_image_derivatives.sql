-- Product image display derivatives.
-- Adds optional transparent-background display images alongside the preserved
-- original upload. All columns are nullable: existing rows keep working
-- unchanged (customers fall back to secure_url when processed_url is NULL).
ALTER TABLE product_images ADD COLUMN processed_public_id TEXT;
ALTER TABLE product_images ADD COLUMN processed_url TEXT;
ALTER TABLE product_images ADD COLUMN processing_status TEXT;
ALTER TABLE product_images ADD COLUMN processed_at TEXT;
