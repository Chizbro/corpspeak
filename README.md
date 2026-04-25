# CorpSpeak

Chatroom: every message is translated into corporate jargon. Translated text is **stored in Supabase Postgres** and **delivered to browsers with Supabase Realtime** (`postgres_changes` on `public.messages`). The UI is a **SvelteKit** app; **API routes** (Gemini translate + insert) run as **Netlify Functions**.

## Stack

- **UI:** SvelteKit + Svelte 5 (runes only)
- **Host:** [Netlify](https://www.netlify.com/) — static assets + SvelteKit serverless functions (`@sveltejs/adapter-netlify`)
- **Data & realtime:** Supabase (Postgres + Realtime)
- **LLM:** Google Gemini (SvelteKit API route `src/routes/api/translate-and-send/+server.ts`)

## Setup

1. **Copy env**

   Copy `.env.example` to `.env`.

2. **Supabase**

   1. Create a project at [supabase.com](https://supabase.com) and run the SQL in `supabase/migrations/` (SQL editor, or `supabase db push` with the CLI).
   2. **Server-only** (Netlify “environment variables” / local `.env`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`
   3. **Public** (baked in at build time): `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` — SvelteKit exposes `PUBLIC_*` to the client. Rebuild after changing them.

3. **Run locally**

   ```bash
   npm install
   npm run dev
   ```

   With all variables set, `npm run dev` uses the same Realtime + API flow as production.

4. **Production build (local check)**

   ```bash
   npm run build
   npm run preview
   ```

   For a Netlify-like dev server (functions + static), use the [Netlify CLI](https://docs.netlify.com/cli/get-started/): `netlify dev`.

## Deploy on Netlify

1. Connect the Git repo in the Netlify UI (or use the CLI).
2. **Build command:** `npm run build`  
   **Publish directory:** `build` (must match [netlify.toml](netlify.toml) — the SvelteKit Netlify adapter writes here).
3. **Environment:** set `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PUBLIC_SUPABASE_URL`, and `PUBLIC_SUPABASE_ANON_KEY`. The `PUBLIC_*` values must be present **before** the build so the client bundle can subscribe to Realtime.

See [DEPLOY.md](DEPLOY.md) and [docs/SUPABASE.md](docs/SUPABASE.md) for details.

## Scripts

- `npm run dev` — Vite + SvelteKit dev
- `npm run build` — Production build (Netlify adapter)
- `npm run preview` — Local preview of the production build
- `npm run check` — `svelte-check`

## Project layout

- `netlify.toml` — Netlify build config
- `src/lib/server/supabaseAdmin.ts` — Service-role Supabase client (server-only, API route)
- `src/routes/+page.svelte` — Room UI; subscribes to Realtime
- `src/routes/api/translate-and-send/+server.ts` — Rate limit, Gemini, insert into `messages`
- `docs/SUPABASE.md` — Schema, env, and deployment notes
- `supabase/migrations/` — Postgres + Realtime publication SQL
