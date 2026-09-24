# D1 Database

Migrations are in `worker/migrations/0001_initial.sql`.

Apply locally:
`npx wrangler d1 migrations apply shano-shan-db --local`

Apply production:
`npx wrangler d1 migrations apply shano-shan-db --remote`

The schema includes users/sessions/staff/roles/permissions, products/variants/images/categories/collections/media, carts/wishlists, addresses, orders/items/payments/receipts, reviews, coupons, banners/homepage/announcements, settings, notifications, reseller profiles and activity logs.
