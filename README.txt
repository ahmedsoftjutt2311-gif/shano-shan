SHANO SHAN FRAGRANCE — SHOP UI/API FIX PATCH

Files to replace in the existing project:
1. customer/src/main.tsx
2. customer/src/styles.css

Fixes included:
- Filter backdrop is mounted ONLY when filterOpen === true.
- Loading overlay no longer paints a full-screen dark/black layer and never blocks the page.
- Network requests have a 15-second AbortController timeout so a stalled request cannot leave loading stuck.
- Shop has its own loading state and a visible retry/error state instead of silently swallowing API failures.
- SS + crown loading mark is larger and responsive.
- Social icons use stable network-specific brand colors (WhatsApp, Instagram, Facebook, TikTok, YouTube), even if some links are disabled.
- Existing product/database/design logic is otherwise preserved.

IMPORTANT API NOTE:
The browser CORS error shown in DevTools is a Worker-side CORS configuration/deployment issue. Frontend code cannot add Access-Control-Allow-Origin to a response. Deploy the existing Worker with the correct CORS allow-list for the current Vercel origin. Do NOT replace the existing Worker/D1 code with a demo worker.

Recommended Worker CORS allow-list:
- Production customer origin
- Existing admin origin
- Approved shanoshanfragrance-*.vercel.app preview origins, if previews are intentionally supported
- OPTIONS must return the same CORS headers as normal responses

No D1 schema/data changes are included in this patch.
