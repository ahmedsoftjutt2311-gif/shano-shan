-- Additive banner typography controls. Existing banner data is preserved.
ALTER TABLE banners ADD COLUMN title_font TEXT NOT NULL DEFAULT 'serif';
ALTER TABLE banners ADD COLUMN subtitle_font TEXT NOT NULL DEFAULT 'sans';
ALTER TABLE banners ADD COLUMN cta_font TEXT NOT NULL DEFAULT 'sans';
