ALTER TABLE orders ADD COLUMN province TEXT;

INSERT OR IGNORE INTO categories(name,slug,description,active,sort_order) VALUES
('Men''s Fragrance','mens-fragrance','Fragrances designed for men.',1,10),
('Women''s Fragrance','womens-fragrance','Fragrances designed for women.',1,20),
('Unisex','unisex','Fragrances designed for everyone.',1,30),
('Attar','attar','Traditional and modern concentrated attars.',1,40),
('Gift Sets','gift-sets','Curated fragrance gift sets.',1,50);
