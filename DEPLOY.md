# Deploying to Cloudflare Pages

## 1. Push your code to GitHub

If you haven’t already:

```bash
git add .
git commit -m "Add Cloudflare adapter for deployment"
git push origin main
```

## 2. Create the project in Cloudflare

1. Open **[Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages)** in the Cloudflare dashboard.
2. Click **Create** → **Pages** → **Connect to Git**.
3. Choose your Git provider (e.g. GitHub) and authorize Cloudflare.
4. Select the **corpspeak** repository (or the repo you’re using).
5. Click **Begin setup**.

## 3. Configure the build

Use these settings:

| Setting | Value |
|--------|--------|
| **Framework preset** | SvelteKit |
| **Production branch** | `main` |
| **Build command** | `npm run build` |
| **Build output directory** | `.svelte-kit/cloudflare` |
| **Deploy command** | `npm run deploy` |

If your project has a **Deploy command** field, set it to `npm run deploy`. (If it’s set to `npx wrangler deploy`, the deploy step will fail; Pages needs `wrangler pages deploy`.)

Optionally set **Project name** (e.g. `corpspeak`); this becomes your `*.pages.dev` subdomain.

## 4. Add environment variables (required for Convex)

Before saving, open **Environment variables** (or set them after the first deploy):

- **Variable name:** `PUBLIC_CONVEX_URL`
- **Value:** your Convex deployment URL (from the [Convex dashboard](https://dashboard.convex.dev) or from running `npx convex dev` — it looks like `https://your-deployment.convex.cloud`).

Add it for **Production** (and **Preview** if you want Convex in preview deployments).

## 5. Deploy

Click **Save and Deploy**. The first build will run; when it finishes, your site will be live at `https://<project-name>.pages.dev`.

## 6. Later deploys

Every push to `main` triggers a new production deploy. Pull requests get preview URLs.

---

**Convex:** Backend is already on Convex. Deploy it with:

```bash
npx convex deploy
```

Use the same Convex deployment URL in `PUBLIC_CONVEX_URL` on Cloudflare so the hosted app talks to your Convex backend.
