# Deploying to Netlify

CorpSpeak is a **SvelteKit** app built with [`@sveltejs/adapter-netlify`](https://svelte.dev/docs/kit/adapter-netlify). Netlify serves the **static front end** and runs **SvelteKit API routes** as **Netlify Functions**. **Realtime** is **not** provided by the host: the browser uses **Supabase Realtime** (WebSocket to Supabase), while translated messages are written with the **service role** from the `translate-and-send` API route.

## 1. Create a site on Netlify

1. Open the [Netlify dashboard](https://app.netlify.com/) and sign in.
2. **Add new site** → **Import an existing project** and connect the Git repository.
3. Netlify can read [netlify.toml](netlify.toml). Confirm:
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
4. **Environment variables** (site settings → **Environment variables**), at minimum:
   - **`GEMINI_API_KEY`** — from [Google AI Studio](https://aistudio.google.com/apikey)
   - **`SUPABASE_URL`**
   - **`SUPABASE_SERVICE_ROLE_KEY`**
   - **`PUBLIC_SUPABASE_URL`** (same project URL; safe to embed in the client bundle)
   - **`PUBLIC_SUPABASE_ANON_KEY`**
   - **`MESSAGE_RETENTION_KEEP`** (optional) — max messages to keep after hourly prune; default `100`

`PUBLIC_*` must be set **before** `npm run build` so Vite inlines them for the browser. After changing any `PUBLIC_` or build-related var, trigger a new deploy.

## 2. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL in `supabase/migrations/` (or use the Supabase CLI).
3. In the Supabase dashboard, add the **`corpspeak`** schema to the Data API’s exposed schemas, ensure **Realtime** is enabled, and confirm `corpspeak.messages` is part of the Realtime publication (as in the migration).

Details: [docs/SUPABASE.md](docs/SUPABASE.md).

## 3. First deploy

Save environment variables, then **Deploy site**. Netlify runs `npm run build` and publishes the `build` output. The live URL is shown in the site overview.

## 4. Notes

- **Message retention:** After you apply migrations, Netlify runs `prune-messages-scheduled` on **production** every hour (see [netlify.toml](netlify.toml)). It calls Supabase RPC `prune_messages_to_limit` so only the newest rows (default 100 total) remain.
- **Node version:** [netlify.toml](netlify.toml) sets `NODE_VERSION` for the build; adjust if your stack requires a different LTS.
- **Cold starts:** free-tier functions may cold-start; the first request after idle can be slower.
- **Rate limiting** in the API route uses in-memory state per function instance; under load, limits are best-effort (same as any stateless host).
