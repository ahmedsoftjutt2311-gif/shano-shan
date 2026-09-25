# SHANO SHAN — FINAL PROFESSIONAL CONTROL REPAIR

## Preserved
- Existing React + Vite customer/admin architecture
- Existing Cloudflare Worker + Hono API
- Existing Cloudflare D1 database and data
- Existing Cloudinary uploads
- Existing authentication/authorization
- Existing product/order/payment/receipt/tracking/return/refund functionality
- Existing horizontal SHANO SHAN logo
- SHANO AI assistant and branded SS+crown loading mark

## Fixed in this build
1. Customer Shop now has explicit loading/error/empty states instead of a blank/black-looking content area when the API is slow or fails.
2. Added a React UI error boundary with a branded recovery screen.
3. Banner customer rendering is now poster-only: no customer-facing title/subtitle/CTA/font/position controls are rendered. One uploaded poster is reused for desktop and mobile automatically.
4. Admin Promotional Banners is simplified to drag/drop or Choose Poster, preview, internal name, order, schedule, active state and optional video.
5. Added delete X control for customer and admin notification items.
6. Added notification-delete API endpoints; no database migration is required for this feature.
7. Added Website Controls in Admin so major customer-facing features can be enabled/disabled without editing code: site availability, maintenance mode, AI, install button, search, filters, reviews flag, top bar, COD and manual online payments.
8. Customer site now respects the AI, install, search, filters and top-bar controls.
9. Maintenance/site-disabled control shows a branded maintenance screen.
10. Existing AI remains enabled by default and remains separate from Find Your Scent.
11. Existing install button remains available and can be controlled from Admin.

## Database
No new migration is required for these changes. Existing D1 tables/columns are reused. Do not reset or recreate the database.

## Production deployment
Customer and Admin are Vite/Vercel projects. Worker is Cloudflare Workers.

From the worker directory, if there are still pending migrations from the previous repair build, apply them normally (do not reset D1), then deploy the Worker.

```powershell
cd D:\shano-shan\worker
npx wrangler d1 migrations apply shanoshan-d1-prod --remote
npx wrangler deploy
```

Then deploy the updated `customer` and `admin` folders to their existing Vercel projects.

## Important banner behavior
Upload one poster only. The customer site uses that same Cloudinary URL for desktop and mobile and automatically crops responsively with CSS. There is no need to create or upload a separate mobile poster.
