# SHANO SHAN FRAGRANCE — Final UX / Checkout / AI Update

This package updates the existing React + Vite customer/admin apps and the existing Cloudflare Hono Worker. It does not replace the architecture or reset D1.

## Main fixes
- Mobile viewport locked to prevent page-level pinch zoom; product images use an image zoom overlay.
- Header/footer logo enlarged while keeping `/shanoshan.png` unchanged.
- Live top bar remains separate and appears above the navbar.
- Homepage banners are now a single responsive auto-sliding carousel with working previous/next/dot controls.
- Admin banner creation uses one poster upload and automatically uses it for desktop/mobile; text position, text color, overlay, title/subtitle size and CTA are configurable.
- Shop filters are collapsed into a compact Search + Filters UI/drawer.
- Product variant price/stock now flow through cart and checkout correctly; selected ML is shown in summaries/order lines.
- Adding/editing/deleting variants automatically synchronizes product price/stock from active variants.
- Pakistan province + searchable city/town checkout selector added; province is stored with the order.
- Online/manual payment receipt is mandatory before the order is created.
- Admin payment verification now has receipt checking and mandatory rejection reason.
- Customer sees payment rejection reason and can upload a replacement receipt.
- Admin payment methods now support add/edit/toggle/delete and customer sees only active methods/details.
- Customer/admin parcel tracking timeline added, including tracking number, courier, tracking URL and tracking events.
- Admin dashboard separates product sales subtotal from delivery collected amount.
- Product delete action added to Admin.
- Independent movable SHANO AI agent added; it is separate from Find Your Scent. It uses Cloudflare Workers AI when available and a catalog-aware fallback when AI inference is unavailable.
- First-visit customer onboarding tour added with Skip.
- Install button appears only when the browser exposes an install prompt and disappears after installation.
- Founder image/name/bio/quote management and Cloudinary upload added to Admin Site Content.
- Contact & Social is managed from Site Content and displayed with compact social/contact icons. Address is not shown in the customer Contact/Footer UI.

## D1 migration
Run against the existing production database; do NOT reset D1:

```bash
cd D:\shano-shan\worker
npx wrangler d1 migrations apply shanoshan-d1-prod --remote
```

Migration file:
`worker/migrations/0006_professional_store_updates.sql`

## Worker deployment
```bash
cd D:\shano-shan\worker
npx wrangler deploy
```

The Worker Wrangler config now contains a Workers AI binding:

```toml
[ai]
binding = "AI"
```

## Customer/Admin build
```bash
cd D:\shano-shan\customer
npm install
npm run build

cd D:\shano-shan\admin
npm install
npm run build
```

## Important
The release archive intentionally excludes `.env`, `.git`, and `node_modules`. Keep production secrets in Vercel/Cloudflare environment settings; never commit them to the archive.
