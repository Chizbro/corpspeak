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

Optionally set **Project name** (e.g. `corpspeak`); this becomes your `*.pages.dev` subdomain.

## 4. Add environment variables

### Required for the deploy step (Wrangler auth)

The deploy command runs `wrangler pages deploy`, which needs **both** of these environment variables:

1. **`CLOUDFLARE_ACCOUNT_ID`** (required in CI)  
   Your account ID. Find it: **Workers & Pages** → any project → the URL is `dash.cloudflare.com/<ACCOUNT_ID>/pages/...`, or from the right-hand **API** section on a domain’s overview.

2. **`CLOUDFLARE_API_TOKEN`**  
   A token with **Account → Cloudflare Pages: Edit** (Pages Write).

   - Create it from the **Account** API Tokens page (so it’s scoped to the right account):  
     **[Account → API Tokens](https://dash.cloudflare.com/?to=/:account/api-tokens)**  
     (Open from the account that owns the Pages project; use the account switcher if you have several.)
   - **Create Token** → **Edit Cloudflare Workers** template, or **Custom token** with **Account** → **Cloudflare Pages: Edit**.
   - Copy the token once (it’s only shown once).

3. In your Pages project: **Settings** → **Environment variables** (under Builds & deployments).  
   Add for **Production** and **Preview**:
   - **`CLOUDFLARE_ACCOUNT_ID`** = your account ID (plain text is fine).
   - **`CLOUDFLARE_API_TOKEN`** = the token (mark as **Encrypted** / secret).

**If you still get “Authentication error [code: 10000]”:**

- Create the token from **Account** API Tokens (not Profile → API Tokens), so it’s an account-scoped token.
- Ensure your user has a role that can manage Workers/Pages (e.g. **Cloudflare Workers Admin** or **Administrator**) on that account. Check: **Account** → **Members** → your user → **Role**.
- Create a **new** token (with Pages: Edit) and replace `CLOUDFLARE_API_TOKEN`; old tokens sometimes don’t get the right scope.

### Required for Convex (your app)

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
