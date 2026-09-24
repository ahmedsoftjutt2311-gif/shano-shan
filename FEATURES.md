# SHANO SHAN FRAGRANCE — COMPLETE PRODUCTION FEATURE SET

This package preserves the existing React/Vite customer + admin applications, Cloudflare Hono Worker, D1 database, Cloudinary media, authentication, cart, checkout, orders and payment verification.

## Customer
- Product listing/search
- Category, gender, rating and ML/size filtering
- Newest / price / rating / views sorting
- Product detail gallery
- Up to 10 product images
- ML/size variants with independent price, sale price and stock
- Minimum/maximum quantity controls
- Add to Cart
- Buy Now → Checkout
- Server-side stock/price/quantity validation
- Quantity-based delivery calculation
- Dynamic payment methods
- Payment receipt upload for supported online payments
- Product view tracking with deduplication
- Approved customer reviews and verified-purchase indicator
- Rating summary and review breakdown
- Existing authentication/session/cart/order functionality preserved
- Responsive customer UI

## Seller Admin
- Protected seller authentication and role/permission checks
- Dashboard sales/order/product/customer statistics
- Product create/edit/delete
- Active/featured/best-seller/new-arrival/limited-edition flags
- SEO fields and fragrance metadata
- Product minimum/maximum quantity
- Up to 10 Cloudinary product images
- Existing-image preview, remove, reorder and primary-image selection
- ML/size variant management with price/sale price/stock/active state
- Order search by order number, customer, phone and email
- Order status and payment-status filters
- Date-range filtering
- Newest/oldest/highest-total/lowest-total sorting
- Complete order details
- Shipping courier, tracking number, tracking URL and internal notes
- Invoice/AWB print/save-to-PDF workflow
- Real XLSX order export generated in-browser
- Existing CSV order export endpoint retained
- Payment verification and receipt viewing
- Customer review search/filter/moderation
- Product views analytics: total/today/week/month
- Most-viewed and top-rated analytics
- Promotional desktop/mobile banners and optional video
- Cloudinary banner uploads
- Website content management
- Store settings
- Quantity-based delivery rules
- Dynamic payment method configuration
- Order-number prefix/sequence configuration
- Invoice/AWB template configuration storage
- Responsive desktop/laptop/tablet-oriented admin UI

## Backend / Production Safety
- Cloudflare Worker + Hono
- Cloudflare D1
- Cloudinary
- Server-side checkout validation
- Existing database records preserved by additive migration design
- CORS for existing production origins plus Seller Vercel origin
- Admin authorization and permission checks
- Activity logging for important admin mutations
- No Firebase, Supabase or R2 replacement
