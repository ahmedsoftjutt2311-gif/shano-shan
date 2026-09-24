# Cloudinary

1. Create a Cloudinary account.
2. From Cloudinary Console, copy Cloud Name and API Key.
3. Keep API Secret private.
4. Store all three as Cloudflare Worker secrets.
5. The browser sends multipart data to the Worker; the Worker signs the Cloudinary request server-side and stores the returned public ID/secure URL in D1.
6. Product images and payment receipts are both Cloudinary resources. Receipt URLs are returned only to the owning customer or authorized staff.

No R2, Firebase Storage, Supabase Storage, or frontend Cloudinary secret is used.
