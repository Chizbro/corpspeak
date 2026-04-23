# Deploying to Render

CorpSpeak runs as a **Node server** (SvelteKit adapter-node). In **legacy** mode it also runs a **WebSocket** on `/ws`. In **Supabase** mode (set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`), the app **does not** use `/ws`—the browser subscribes to **Supabase Realtime** instead. Render’s free tier can run it.

## 1. Create a Web Service on Render

1. Go to [dashboard.render.com](https://dashboard.render.com) and sign in.
2. **New +** → **Web Service**.
3. Connect your Git repository (GitHub/GitLab) and select the corpspeak repo.
4. Configure:
   - **Name:** corpspeak (or any name).
   - **Region:** choose one.
   - **Branch:** main (or your default).
   - **Runtime:** Node.
   - **Build command:** `npm run build`
   - **Start command:** `npm start`
   - **Instance type:** Free (if available).

## 2. Environment variables

In the Render service → **Environment**, set at least:

- **`GEMINI_API_KEY`:** your Google AI Studio API key ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)).

**If you use Supabase** (see [docs/SUPABASE_MIGRATION_OPTION_B.md](docs/SUPABASE_MIGRATION_OPTION_B.md)) add:

- **`SUPABASE_URL`**
- **`SUPABASE_SERVICE_ROLE_KEY`**
- **`PUBLIC_SUPABASE_URL`** (same project URL, safe to expose in the client bundle)
- **`PUBLIC_SUPABASE_ANON_KEY`**

The `PUBLIC_*` values must be present **before** `npm run build` so the client can subscribe to Realtime.

Save. Render will redeploy when you add or change env vars (or trigger a deploy).

## 3. Deploy

Click **Create Web Service** (or **Manual Deploy** if the service already exists). Render will run `npm run build` then `npm start`. The app listens on the port Render sets via `PORT`.

Your app will be at `https://<service-name>.onrender.com`. WebSocket connections use the same host at path `/ws` (wss when the site is HTTPS).

## 4. Notes

- **Free tier:** The service may spin down after inactivity; the first request after that can be slow (cold start).
- **WebSocket (legacy only):** Render supports WebSockets; the client uses `wss://<host>/ws` when the page is HTTPS. Skip this when using **Supabase Realtime**.
- No Cloudflare or Netlify serverless; this is a single long-lived Node process.
