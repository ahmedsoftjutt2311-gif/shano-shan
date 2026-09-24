# SHANO SHAN — Production Repair Notes

This build keeps the existing React/Vite customer + admin apps, Cloudflare Worker/Hono API, D1 database and Cloudinary architecture.

## Important production fix

The previous `worker/migrations/0006_professional_store_updates.sql` attempted to add `orders.province` a second time even though migration `0005_shipping_locations_categories.sql` already adds it. That caused the later professional-store migration to fail, leaving the production D1 schema without tracking, receipt-rejection and banner-control fields while the Worker code was already using them. That is the main cause of the checkout/API 500 errors seen in the browser console.

The duplicate `province` statement has now been removed from migration 0006. Existing data is not deleted or reset.

## Deploy

From `worker/`:

```bash
npm install
npx wrangler d1 migrations apply shanoshan-d1-prod --remote
npx wrangler deploy
```

Then deploy `customer/` and `admin/` to their existing Vercel projects.

## What was repaired

- Checkout order creation no longer depends on an unapplied duplicate migration.
- Online-payment receipt remains mandatory.
- Admin can open the receipt directly from an order and from Payment Verification.
- Admin must enter a reason when rejecting a receipt; the customer receives a notification and can upload a replacement receipt.
- New-order notifications are sent to active admin/staff accounts.
- Customer and admin order details expose payment receipt data.
- Parcel tracking history is recorded for order creation and every status change.
- Customer order details show a professional tracking timeline and courier tracking link.
- Selected product variant/ML is shown in order details.
- Admin variant changes automatically synchronize the parent product price/sale price/stock from active variants.
- City checkout uses a real province-filtered dropdown using the Pakistan city list.
- SHANO AI remains enabled as a separate store assistant. It uses current store/catalog data and multilingual responses, with multiple current Workers AI model fallbacks.
- Banner upload remains a single-poster workflow; the same uploaded poster is automatically used responsively on desktop/mobile. Separate title/subtitle/CTA font dropdowns remain available.
- Mobile layout is tightened to prevent horizontal overflow and improve banner/shop/tracking presentation.
- Existing logo/loading behavior is preserved: the SS crown mark is used for the loading animation, while the full horizontal logo remains in the header/footer.

## Database safety

No existing rows are deleted or reset by these changes. Migration 0006 is additive and now no longer contains the duplicate `province` column operation.
