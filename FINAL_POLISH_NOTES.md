SHANO SHAN FRAGRANCE — FINAL POLISH UPDATE — 2026-09-26

Preserved the existing React/Vite + Cloudflare Worker/Hono + D1 + Cloudinary architecture and existing D1 data model.

Applied final fixes:
- Customer product cards: corrected responsive product image fitting for mobile/desktop.
- Product cards: ADD TO CART button restored with lighter professional typography.
- Product sharing: native share, WhatsApp and copy-link actions added to product cards/detail pages.
- App sharing: Share SHANO SHAN action added in footer.
- Loading UI: replaced the dark full-screen loading layer with a transparent loader using the SS+crown crop from the exact existing logo artwork; increased size/clarity.
- Loading requests: API requests now have a 20-second timeout so a stalled request cannot keep the loading state indefinitely.
- Shop filter overlay remains conditional on filterOpen only.
- Promotional banners: admin UI simplified to one-poster upload, title, subtitle, CTA text/link, schedule, order and active status; removed manual text-position/font/color controls; added edit support; customer carousel remains responsive and auto-scrolling.
- Delivery estimates: admin can control Advance Payment delivery text and COD delivery text. Defaults are 3–4 days and 7 days. Customer checkout displays the estimate for the selected payment method.
- Admin install option: added PWA manifest/install prompt button when the browser supports installation.
- Social footer icons now use recognizable brand colors.
- Existing CORS allow-list now includes the current Vercel customer preview origin seen in the latest console error.
- No D1 migration was added for these changes; delivery-day values use the existing generic settings table.

Important deployment:
1. Deploy worker/src/index.ts with the existing Cloudflare Worker and D1 binding.
2. Set/keep ALLOWED_ORIGINS in Cloudflare Worker vars with all production customer/admin origins.
3. Deploy customer and admin from their source folders through Vercel.
4. Do not reset or recreate D1.
5. Existing Cloudinary credentials remain environment/secret based.
