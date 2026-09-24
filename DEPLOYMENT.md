# Deployment — first 3 steps

## Step 1 — Push the project to GitHub
From PowerShell in the extracted folder:

```powershell
git init
git add .
git commit -m "Initial SHANO SHAN ecommerce platform"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/shano-shan.git
git push -u origin main
```

Create the repository on GitHub first. Do not commit `.env` files or Cloudinary secrets.

## Step 2 — Create/configure Cloudflare D1 + Worker
Install Node.js and Wrangler, then:

```powershell
cd worker
npm install
npx wrangler login
npx wrangler d1 create shano-shan-db
```

Copy the returned database ID into `worker/wrangler.toml`.
Then:

```powershell
npx wrangler d1 migrations apply shano-shan-db --remote
npm run dev
```

Configure Worker secrets (never put these in Git):

```powershell
npx wrangler secret put SESSION_SECRET
npx wrangler secret put CLOUDINARY_CLOUD_NAME
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put CLOUDINARY_API_SECRET
npx wrangler secret put ADMIN_SETUP_KEY
```

Deploy:

```powershell
npx wrangler deploy
```

## Step 3 — Deploy Customer + Admin separately on Netlify
Create two Netlify sites from the same GitHub repository.

Customer:
- Base directory: `customer`
- Build command: `npm run build`
- Publish directory: `customer/dist`
- Environment variable: `VITE_API_BASE_URL=https://YOUR-WORKER.workers.dev`

Admin:
- Base directory: `admin`
- Build command: `npm run build`
- Publish directory: `admin/dist`
- Environment variable: `VITE_API_BASE_URL=https://YOUR-WORKER.workers.dev`

Both apps include SPA redirects. After deployment, test admin login and the end-to-end flow in TESTING.md.

### Production domains
Point `www.shanoshan.com` to the customer Netlify site and `admin.shanoshan.com` to the admin Netlify site. Add both exact origins to Worker CORS settings in `worker/src/index.ts` (and your local origins while developing).

## Latest checkout / AI / PWA migration

After deploying this version, apply the additive D1 migration from `worker/migrations/0003_checkout_ai_pwa.sql`:

```bash
cd D:\shano-shan\worker
npx wrangler d1 migrations apply shanoshan-d1-prod --remote
npx wrangler deploy
```

This migration adds payment method type support, COD delivery advance settings, and temporary receipt-upload records. It does not reset or delete existing production data.

The Worker AI route now uses the active Cloudflare Workers AI fast Llama 3.1 model with a Llama 3.2 multilingual fallback. Workers AI must be enabled for the `AI` binding in the Worker.
