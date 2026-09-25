# SHANO SHAN — A to Z completion pass

This package contains the source-level repair/completion pass for the customer storefront, seller center and Cloudflare Worker.

## Completed
- Guest cart ID persistence and guest-to-user cart merge.
- Product/variant availability and quantity validation.
- Product image fallback from product images to active variant images.
- Customer image/API error states and retry UI on Shop.
- Server-side customer and seller logout.
- Safe order archival instead of destructive deletion.
- One-time inventory restoration guard for cancelled/returned orders.
- Closed-order reopening protection.
- Saved customer addresses UI + API.
- Wishlist UI + API.
- Coupon checkout validation, discount calculation and coupon usage recording.
- Seller Customers management.
- Seller Collections management.
- Seller Coupons management.
- Seller Staff & Roles management.
- Seller Homepage Builder management.
- Seller Media Library management.
- Production CORS/config cleanup from the repair pass.
- D1 integrity migration 0008.
- Customer/Admin/Worker TypeScript checks pass.

## Verification
- customer: `npx tsc -b --pretty false` — PASS
- admin: `npx tsc -b --pretty false` — PASS
- worker: `npx tsc --noEmit --pretty false` — PASS

The Vite/Rolldown binary in the supplied Windows `node_modules` cannot execute in the Linux audit container. Do not ship `node_modules`; run a fresh `npm install` in Vercel/your local environment before deployment.

## Deployment order
1. Apply Worker migration 0008 to the production D1 database.
2. Deploy the Worker.
3. Deploy `customer/` to the customer Vercel project.
4. Deploy `admin/` to the seller Vercel project.
5. Confirm `VITE_API_BASE_URL` points to the production Worker URL.
6. Test: guest cart, login/cart merge, Shop images, checkout, coupon, order, admin status changes, customer cancellation/return, wishlist, addresses, Customers, Collections, Coupons, Staff, Homepage and Media.
