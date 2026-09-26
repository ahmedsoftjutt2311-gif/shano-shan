# SHANO SHAN — Variant Image Update

Only the requested product-variant image improvement was applied.

## Changes
- Reused the existing `product_variants.image_url` database column; no migration or database schema change.
- Admin variant manager now supports adding, editing, replacing, previewing, and removing a variant-specific image.
- Variant images are uploaded to Cloudinary under a variant-specific folder and saved on that exact variant.
- Customer product detail automatically switches to the selected variant image.
- Cart uses the selected variant image when one exists, otherwise the main product image.
- Customer/admin order APIs now expose variant image information for existing image-display areas.
- Existing product/variant grouping, prices, stock, cart, checkout, orders, authentication, payments, search, filters, and design were otherwise left unchanged.
