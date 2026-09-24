# SHANO SHAN FRAGRANCE

Production-oriented two-app ecommerce platform: Customer Store + separate Seller Admin, backed by Cloudflare Workers + D1 + Cloudinary.

## Stack
- Customer: React + TypeScript + Vite
- Admin: React + TypeScript + Vite
- API: Cloudflare Worker + TypeScript
- Database: Cloudflare D1
- Media: Cloudinary via Worker-side upload proxy

## Apps
- customer/: public store
- admin/: private seller center
- worker/: API and D1 migrations
- shared/types/: shared API types

See DEPLOYMENT.md, DATABASE.md, API.md, CLOUDINARY.md and TESTING.md.

## Latest production polish
- Online payment receipts are mandatory before an order can be created.
- Payment methods support Online/COD type, edit/delete/enable/disable, and only active admin-configured details are shown to customers.
- Admin can configure a COD delivery advance amount.
- SHANO AI is a separate multilingual store assistant, not the Find Your Scent quiz.
- Cloudflare Workers AI uses the active fast Llama model with a multilingual fallback.
- Customer PWA install control appears only when the browser exposes an install prompt and disappears after installation.
- Loading overlays use only the gold S+crown brand mark; no spinner, circle loader, or SHANO AI text.

## Latest customer commerce updates
- Product sales and delivery charges are reported separately in the admin dashboard.
- Customers can request cancellation before shipping or a return after delivery; shipped/in-transit orders cannot be cancelled/returned.
- Admin must approve the customer request before refund processing begins.
- Customer submits refund account details after approval.
- Admin uploads the final refund payment receipt through Cloudinary to complete the refund.
- Delivered orders receive a 7-day review reminder; review submission is server-validated for the actual purchaser within that 7-day window.
- New product listings and price increases create in-site customer notifications.
- Customer header/footer use the full SHANO SHAN logo; the SS+crown mark is used for the PWA/app icon and loading mark.

## Final UX polish pass — 2026-09-24
- Customer and seller experiences keep the existing React/Vite + Worker/Hono + D1 + Cloudinary architecture.
- SHANO AI now tries the currently active multilingual `@cf/meta/llama-3.2-3b-instruct` model first, then `@cf/meta/llama-3.1-8b-instruct-fast` as a fallback.
- Admin product search is non-destructive and searches product name, SKU and slug.
- Live Top Bar messages can be edited as well as enabled/disabled/deleted.
- Destructive product deletion remains protected by confirmation and server-side historical-order archiving.
- Full SHANO SHAN logo is used in customer/admin header and footer/brand areas; the SS+Crown mark is reserved for compact app/loading surfaces.
- No new D1 migration is required for this UX-only pass.

Before deployment, install dependencies fresh in each app and run the normal customer/admin builds plus Wrangler deploy.

## Latest checkout/location update

- Customer checkout now uses a Pakistan province/territory selector and a city autocomplete list filtered by the selected province.
- Orders persist the selected province in D1.
- Shop search is compact; category/rating/gender/size/sort controls are inside a filter drawer opened by the Filter icon.
- Admin banner start/end fields use calendar/date-time controls.
- Migration `0005_shipping_locations_categories.sql` seeds standard fragrance categories: Men's Fragrance, Women's Fragrance, Unisex, Attar, and Gift Sets.

Apply the additive migration remotely before deploying the Worker:

```bash
cd D:\shano-shan\worker
npx wrangler d1 migrations apply shanoshan-d1-prod --remote
npx wrangler deploy
```
