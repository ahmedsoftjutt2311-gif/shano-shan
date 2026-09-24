# SHANO SHAN — Production Repair Checklist

This repair keeps the existing React/Vite customer + admin apps, Cloudflare Hono Worker, D1 database, Cloudinary uploads, authentication and existing data.

## Critical database fix

`worker/migrations/0005_shipping_locations_categories.sql` already adds `orders.province`.
The previous `0006_professional_store_updates.sql` incorrectly tried to add the same column again. That caused migration 0006 to fail and left later production features unavailable, including tracking and receipt rejection. The duplicate statement has now been removed.

Apply the existing migrations to the production database before deploying the Worker:

```powershell
cd D:\shano-shan\worker
npm install
npx wrangler d1 migrations apply shanoshan-d1-prod --remote
npx wrangler deploy
```

Do not reset, drop, or recreate the production D1 database.

## Fixed in this repair

- Customer Shop black/empty rendering issue: fixed invalid duplicate JSX closing tag and tightened mobile layout.
- Mobile page zoom disabled; product image zoom remains available through the image lightbox.
- Checkout city selector now supports typing/searching within the selected Pakistan province using the supplied Pakistan city list.
- Cart now uses the selected variant's price, sale price, stock and ML/variant name, so cart subtotal and checkout remain consistent with the selected variant.
- Initial online-payment reference/note are saved with the order payment record.
- Online payment receipt remains mandatory before order placement.
- Admin order details expose payment receipt information.
- Receipt rejection requires a reason and sends the reason to the customer.
- New orders notify active admin/staff accounts.
- Customer/admin parcel tracking remains active through tracking events, courier, tracking number and URL.
- Variant changes synchronize parent product price/sale price/stock.
- SHANO AI remains a separate store assistant and now uses currently valid Cloudflare Workers AI model identifiers, including the current `llama-3.1-8b-instruct-fast` model.
- Admin Promotional Banners now use one poster upload with automatic responsive desktop/mobile fitting. No manual X/Y positioning or separate mobile poster is required.
- Banner Title Font, Subtitle Font and CTA Font remain separate dropdown controls.
- Banner upload UI now supports drag/drop, preview, simple editing and clear active/order controls.
- Existing horizontal SHANO SHAN logo and SS+crown loading mark are preserved.

## Build

```powershell
cd D:\shano-shan\customer
npm install
npm run build

cd D:\shano-shan\admin
npm install
npm run build
```

Deploy the built customer/admin apps to their existing Vercel projects. Do not replace the existing Worker/D1/Cloudinary architecture.
