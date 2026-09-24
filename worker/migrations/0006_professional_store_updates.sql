-- Additive production-safe migration. No existing rows are deleted or reset.
ALTER TABLE orders ADD COLUMN province TEXT;
ALTER TABLE payments ADD COLUMN rejection_reason TEXT;
ALTER TABLE payments ADD COLUMN verification_receipt_public_id TEXT;
ALTER TABLE payments ADD COLUMN verification_receipt_url TEXT;
ALTER TABLE banners ADD COLUMN text_color TEXT NOT NULL DEFAULT '#ffffff';
ALTER TABLE banners ADD COLUMN overlay_color TEXT NOT NULL DEFAULT 'rgba(0,0,0,0.38)';
ALTER TABLE banners ADD COLUMN text_x INTEGER NOT NULL DEFAULT 8;
ALTER TABLE banners ADD COLUMN text_y INTEGER NOT NULL DEFAULT 50;
ALTER TABLE banners ADD COLUMN title_size INTEGER NOT NULL DEFAULT 48;
ALTER TABLE banners ADD COLUMN subtitle_size INTEGER NOT NULL DEFAULT 16;

CREATE TABLE IF NOT EXISTS tracking_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_tracking_events_order ON tracking_events(order_id, created_at);

CREATE TABLE IF NOT EXISTS refund_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  refund_name TEXT,
  refund_account TEXT,
  refund_bank TEXT,
  admin_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_refund_requests_order ON refund_requests(order_id);

CREATE TABLE IF NOT EXISTS store_cities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_store_cities_unique ON store_cities(province, city);

INSERT OR IGNORE INTO store_cities(province,city) VALUES
('Punjab','Lahore'),('Punjab','Rawalpindi'),('Punjab','Faisalabad'),('Punjab','Multan'),('Punjab','Gujranwala'),('Punjab','Sialkot'),('Punjab','Bahawalpur'),('Punjab','Sargodha'),('Punjab','Sheikhupura'),('Punjab','Jhang'),('Punjab','Gujrat'),('Punjab','Rahim Yar Khan'),('Punjab','Sahiwal'),('Punjab','Okara'),('Punjab','Kasur'),('Punjab','Dera Ghazi Khan'),('Punjab','Wah Cantt'),('Punjab','Taxila'),('Punjab','Attock'),('Punjab','Chakwal'),('Punjab','Jhelum'),('Punjab','Mandi Bahauddin'),('Punjab','Hafizabad'),('Punjab','Narowal'),('Punjab','Mianwali'),('Punjab','Bhakkar'),('Punjab','Khushab'),('Punjab','Layyah'),('Punjab','Lodhran'),('Punjab','Khanewal'),('Punjab','Muzaffargarh'),('Punjab','Pakpattan'),('Punjab','Vehari'),('Punjab','Toba Tek Singh'),('Punjab','Chiniot'),('Punjab','Nankana Sahib'),('Punjab','Wazirabad'),('Punjab','Kamoke'),('Punjab','Gujranwala Cantt'),('Punjab','Murree'),('Punjab','Kot Addu'),
('Sindh','Karachi'),('Sindh','Hyderabad'),('Sindh','Sukkur'),('Sindh','Larkana'),('Sindh','Nawabshah'),('Sindh','Mirpur Khas'),('Sindh','Jacobabad'),('Sindh','Shikarpur'),('Sindh','Khairpur'),('Sindh','Dadu'),('Sindh','Thatta'),('Sindh','Badin'),('Sindh','Tando Adam'),('Sindh','Tando Allahyar'),('Sindh','Umerkot'),('Sindh','Matiari'),('Sindh','Ghotki'),('Sindh','Kashmore'),('Sindh','Naushahro Feroze'),('Sindh','Sanghar'),('Sindh','Jamshoro'),('Sindh','Kotri'),
('Khyber Pakhtunkhwa','Peshawar'),('Khyber Pakhtunkhwa','Mardan'),('Khyber Pakhtunkhwa','Abbottabad'),('Khyber Pakhtunkhwa','Mingora'),('Khyber Pakhtunkhwa','Kohat'),('Khyber Pakhtunkhwa','Dera Ismail Khan'),('Khyber Pakhtunkhwa','Bannu'),('Khyber Pakhtunkhwa','Swabi'),('Khyber Pakhtunkhwa','Nowshera'),('Khyber Pakhtunkhwa','Charsadda'),('Khyber Pakhtunkhwa','Haripur'),('Khyber Pakhtunkhwa','Mansehra'),('Khyber Pakhtunkhwa','Batagram'),('Khyber Pakhtunkhwa','Karak'),('Khyber Pakhtunkhwa','Lakki Marwat'),('Khyber Pakhtunkhwa','Chitral'),('Khyber Pakhtunkhwa','Dir'),('Khyber Pakhtunkhwa','Buner'),('Khyber Pakhtunkhwa','Khyber'),('Khyber Pakhtunkhwa','Swat'),('Khyber Pakhtunkhwa','Tank'),
('Balochistan','Quetta'),('Balochistan','Gwadar'),('Balochistan','Turbat'),('Balochistan','Khuzdar'),('Balochistan','Chaman'),('Balochistan','Sibi'),('Balochistan','Zhob'),('Balochistan','Loralai'),('Balochistan','Dera Murad Jamali'),('Balochistan','Kalat'),('Balochistan','Nushki'),('Balochistan','Lasbela'),('Balochistan','Hub'),('Balochistan','Mastung'),('Balochistan','Pishin'),
('Islamabad Capital Territory','Islamabad'),
('Azad Jammu & Kashmir','Muzaffarabad'),('Azad Jammu & Kashmir','Mirpur'),('Azad Jammu & Kashmir','Kotli'),('Azad Jammu & Kashmir','Rawalakot'),('Azad Jammu & Kashmir','Bagh'),('Azad Jammu & Kashmir','Bhimber'),('Azad Jammu & Kashmir','Neelum'),('Azad Jammu & Kashmir','Hattian Bala'),
('Gilgit-Baltistan','Gilgit'),('Gilgit-Baltistan','Skardu'),('Gilgit-Baltistan','Chilas'),('Gilgit-Baltistan','Hunza'),('Gilgit-Baltistan','Ghizer'),('Gilgit-Baltistan','Astore'),('Gilgit-Baltistan','Diamer'),('Gilgit-Baltistan','Nagar');

INSERT OR IGNORE INTO tracking_events(order_id,status,title,description) SELECT id,status,
  CASE status WHEN 'Pending' THEN 'Order received' WHEN 'Payment Verification' THEN 'Payment under verification' WHEN 'Confirmed' THEN 'Order confirmed' WHEN 'Processing' THEN 'Preparing your parcel' WHEN 'Packed' THEN 'Parcel packed' WHEN 'Shipped' THEN 'Parcel handed to courier' WHEN 'Out for Delivery' THEN 'Out for delivery' WHEN 'Delivered' THEN 'Delivered' ELSE status END,
  'Order status updated' FROM orders;

INSERT OR IGNORE INTO categories(name,slug,sort_order,active) VALUES
('Men''s Fragrance','mens-fragrance',1,1),
('Women''s Fragrance','womens-fragrance',2,1),
('Unisex','unisex',3,1),
('Attar','attar',4,1),
('Gift Sets','gift-sets',5,1);
