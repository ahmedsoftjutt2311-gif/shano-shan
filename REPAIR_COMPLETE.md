# SHANO SHAN Production Repair Pass

## Applied in this repair build

- Persistent guest cart ID in customer localStorage using `X-Cart-ID`.
- Guest cart is merged into the authenticated customer's cart after login/register.
- Active product + active variant validation at cart add/update.
- Product min/max quantity validation at cart add/update.
- Product image broken-URL fallback in customer product cards.
- Shop page now shows an actionable API/network error and retry state instead of silently rendering an empty/dark grid.
- Customer account sign-out now revokes the server session before clearing the local token.
- Seller Center sign-out now revokes the server session.
- Admin order delete no longer destroys historical order/payment data or blindly restores inventory; it archives/cancels instead.
- Inventory restoration for admin/customer cancellation/return is idempotent using `orders.inventory_restored_at`.
- Saved-address APIs completed for the existing `addresses` table.
- Wishlist APIs completed for the existing `wishlists` / `wishlist_items` tables.
- Coupon validation API completed for the existing coupon tables.
- Production CORS allow-list now includes the deployed Vercel customer and seller origins in `wrangler.toml`.
- Added migration `0008_production_integrity.sql`.

## Verification performed

- Customer Vite production build completed and generated `customer/dist`.
- Worker source was transpiled with TypeScript's compiler API with zero syntax diagnostics.
- Existing source-level TypeScript checks had previously passed before dependency cleanup; a fresh full type-check requires a complete dependency install in the target environment.

## Deployment steps

1. Run a clean `npm ci` in `customer`, `admin`, and `worker` in the deployment environment.
2. Build customer and admin.
3. Apply D1 migration `0008_production_integrity.sql` using the project's normal Wrangler migration workflow.
4. Deploy the Worker.
5. Deploy both Vercel applications.
6. Verify the production API health endpoint, Shop, guest cart, login/cart merge, checkout, admin cancellation, and payment verification against the production D1 database.

## Important

This repair build deliberately does not delete `.git` history or rewrite the application's architecture. The existing application is kept intact while correcting production-critical behavior.
