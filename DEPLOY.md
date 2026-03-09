# Deploying to Cloudflare Pages

This guide uses the **Wrangler CLI** to deploy. You build locally, deploy with `wrangler pages deploy`, then set your Convex URL on the resulting Pages project in the dashboard.

## 1. One-time: Cloudflare API token and account ID

Wrangler needs these to deploy. Set them in your environment (e.g. in `.env.local` for local use, or in your CI env).

1. **Account ID**  
   Find it in the dashboard when you’re in Workers & Pages: the URL is `dash.cloudflare.com/<ACCOUNT_ID>/pages/...`. Or use any domain’s **Overview** → **API** section (right-hand side).

2. **API token**  
   - Go to **[Account → API Tokens](https://dash.cloudflare.com/?to=/:account/api-tokens)** (for the account that will own the Pages project).
   - **Create Token** → use **Edit Cloudflare Workers** or a **Custom token** with **Account** → **Cloudflare Pages: Edit**.
   - Copy the token once (it’s only shown once).

Export them (or add to `.env.local` and load with `dotenv` / your shell):

```bash
export CLOUDFLARE_ACCOUNT_ID="your_account_id"
export CLOUDFLARE_API_TOKEN="your_token"
```

## 2. Build and deploy with Wrangler

From the project root:

```bash
npm run build
npm run deploy
```

Or in one step:

```bash
npm run build && npm run deploy
```

- If Wrangler says the project doesn’t exist and asks to create it, answer **Yes**. That creates the Pages project (e.g. `corpspeak`) and deploys.
- The site will be at `https://<project-name>.pages.dev` (e.g. `https://corpspeak.pages.dev`).

## 3. Set `PUBLIC_CONVEX_URL` on the Pages project

The app needs your Convex deployment URL at runtime. Set it on the **Pages project** (not in Wrangler):

1. Open **[Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages)** in the Cloudflare dashboard.
2. Open your **Pages** project (the name you gave when deploying, e.g. **corpspeak**).
3. Go to **Settings** → **Environment variables** (under **Builds & deployments**).
4. Add a variable:
   - **Variable name:** `PUBLIC_CONVEX_URL`
   - **Value:** your Convex deployment URL (e.g. `https://your-deployment.convex.cloud`).  
     Get it from the [Convex dashboard](https://dashboard.convex.dev) or from `npx convex dev`.
5. Apply to **Production** (and **Preview** if you use preview deployments).
6. Save. New requests will use the variable; you don’t need to redeploy for env changes on Pages.

Your Convex backend stays on Convex; deploy it with:

```bash
npx convex deploy
```

Use the same URL in `PUBLIC_CONVEX_URL` so the hosted app talks to that backend.

## 4. Later deploys

To update the site:

```bash
npm run build && npm run deploy
```

Redeploy whenever you change app code. Change `PUBLIC_CONVEX_URL` only in the dashboard when you switch Convex deployments.

---

## Optional: Deploy from Git (CI)

If you later want builds and deploys from Git (e.g. on push):

1. In **Workers & Pages**, create a **Pages** project and **Connect to Git**.
2. Set **Build command** to `npm run build`, **Build output directory** to `.svelte-kit/cloudflare`, and **Deploy command** to `npm run deploy`.
3. In that project’s **Settings** → **Environment variables**, add:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN` (Encrypted)
   - `PUBLIC_CONVEX_URL` (your Convex URL)

Then set `PUBLIC_CONVEX_URL` the same way as in step 3 above.
