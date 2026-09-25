# SHANO SHAN CORS FIX

Fixed the Worker CORS middleware for the current Vercel customer deployment:
`https://shanoshanfragrance-34ikk8xgx-ahmed-developer1.vercel.app`

## What changed
- Added the current Vercel deployment origin to the Worker allow-list.
- Added a restricted preview-origin matcher for this SHANO SHAN Vercel project naming pattern.
- OPTIONS preflight now returns the required CORS headers.
- Normal API responses now receive the same CORS headers.
- Added `X-Requested-With` to allowed request headers.
- No D1 schema/data changes were made.
- No customer/admin UI or business logic was intentionally changed.

## Deploy
From `worker`:

```bash
npm install
npx wrangler deploy
```

After deployment, hard-refresh the customer site (Ctrl+F5) and test `/shop`.

The `vercel.com/sso-api` manifest warning is separate from the Worker CORS issue; it comes from Vercel deployment protection/SSO and does not need to be fixed in the Worker to restore API CORS.
