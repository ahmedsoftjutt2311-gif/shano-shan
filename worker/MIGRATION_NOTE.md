# SHANO SHAN production ecommerce migration

Migration `0002_production_ecommerce.sql` is the additive schema migration used by this package.

It adds product quantity limits, product-variant active state, product-view analytics, quantity-based delivery rules, dynamic payment methods, document-template storage and order-number sequencing without resetting existing product/order/customer data.

The current feature-complete Worker also uses the existing `product_images` table for up to 10 Cloudinary images per product and provides safe primary/reorder/delete management endpoints.

## Apply once if 0002 has not already been applied

```powershell
cd D:\shano-shan\worker
npx wrangler d1 migrations apply shano-shan-db --remote
```

Do not run destructive/reset commands against the production database.

The CORS and image/order/review route improvements in the current Worker do not require another D1 migration.

## Migration 0004 — Customer Returns / Refunds / Notifications

Run remotely after deploying the updated Worker:

```bash
npx wrangler d1 migrations apply shanoshan-d1-prod --remote
npx wrangler deploy
```

Adds customer cancellation/return requests, refund details/status, refund receipt fields, delivered timestamp, and notification support. Existing production rows are preserved.
