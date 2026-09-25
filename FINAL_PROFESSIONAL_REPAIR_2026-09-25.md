# SHANO SHAN — Professional Repair 2026-09-25

## Preserved
- Existing React/Vite customer and admin architecture.
- Existing Cloudflare Worker/Hono API and Cloudflare D1.
- Existing Cloudinary flow.
- Existing D1 records; no reset/recreate operation.
- Existing SHANO SHAN horizontal logo and SS+crown loading mark.

## Fixed / added
- Shop page visual shell and responsive layout to prevent the large empty/black visual state.
- Responsive single-poster promotional banners; no manual desktop/mobile poster setup.
- Optional banner CTA button text/link.
- Notification delete controls with optimistic UI and Worker delete endpoint.
- Website Controls with customer-facing feature toggles.
- Customer forgot-password recovery using a fresh random maths challenge per recovery request.
- Admin password change requiring the current password.
- Return evidence photos mandatory; maximum five images; return window enforced at 48 hours after delivery.
- Return evidence visible in customer order details and admin order details.
- Payment receipt display constrained responsively on customer/admin.
- Featured product badge displayed on the product image.
- ADD TO CART buttons.
- Product sharing using native device share when available, otherwise copy link.
- Colored footer social icons.
- Pakistan city selector as a real province-filtered dropdown.

## Database migration
Added additive migration:
- `worker/migrations/0008_password_reset_returns.sql`

It creates password recovery challenges, return image records, and banner CTA fields. It does not delete or reset existing data.

## Validation
- Customer/Admin/Worker source files transpile successfully with TypeScript 5.8 syntax validation.
- All migrations 0001 through 0008 execute successfully against SQLite validation.
- `replaceAll()` removed from Admin TypeScript source so the ES2020 target does not trigger that build error.

## Production
After deployment, apply only the pending migration normally:
`npx wrangler d1 migrations apply shanoshan-d1-prod --remote`

Then deploy the Worker and the two Vite apps. Do not reset the D1 database.
