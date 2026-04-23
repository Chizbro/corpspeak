# CorpSpeak

Chatroom: every message is translated into corporate jargon. **By default (legacy):** no database—an in-process WebSocket broadcasts to clients that are online. **With Supabase (migration [Option B](docs/SUPABASE_MIGRATION_OPTION_B.md)):** translated text is **stored in Postgres** and **delivered with Supabase Realtime** (no app-managed `/ws` in production).

## Stack

- **UI:** SvelteKit + Svelte 5 (runes only)
- **Host:** Node (adapter-node); deploy on **Render** or any Node host
- **Real-time (choose one):**
  - **Legacy:** In-process WebSocket on `/ws`
  - **Supabase:** `INSERT` on `public.messages` + `postgres_changes` (see [docs](docs/SUPABASE_MIGRATION_OPTION_B.md))
- **LLM:** Google Gemini (via SvelteKit API route)

## Setup

1. **Env**

   Copy `.env.example` to `.env` and set at least `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey).

2. **Supabase (optional but recommended for hosted multi-user)**

   1. Create a project at [supabase.com](https://supabase.com) and run the SQL in `supabase/migrations/` (SQL editor: paste and run, or `supabase db push` with the CLI).
   2. Set **server** env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   3. Set **public** (browser) env: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` — SvelteKit exposes `PUBLIC_*` to the client; rebuild after changing them.

3. **Run locally**

   **Production-style (Node; legacy uses WebSocket on `/ws`):**

   ```bash
   npm install
   npm run build
   npm start
   ```

   **Vite dev server** (`npm run dev`):

   - **Legacy (no Supabase):** the API still returns *your* translated message, but other tabs do not get a live feed (Vite does not run `server.js` WebSockets).
   - **With Supabase env:** Realtime works in dev—multi-tab without `npm start`.

## Deploy on Render

1. Create a **Web Service** and connect your repo.
2. **Build command:** `npm run build`
3. **Start command:** `npm start`
4. **Environment:** `GEMINI_API_KEY` and, for Supabase mode, the five variables listed in `.env.example`.
5. Render sets `PORT`; the app uses it automatically.

See [DEPLOY.md](DEPLOY.md) for more detail (WebSocket vs Supabase).

## Scripts

- `npm run dev` — SvelteKit dev (WebSocket only if you add a custom Vite plugin; use Supabase Realtime for live updates in dev)
- `npm run build` — Production build
- `npm start` — Node: SvelteKit + WebSocket in **legacy** mode; in **Supabase** mode, `/ws` is disabled (Realtime only)

## Project layout

- `server.js` — Custom Node server: SvelteKit handler, optional WebSocket on `/ws` (legacy)
- `src/lib/ws-clients.js` — Shared WebSocket client set and broadcast (legacy)
- `src/lib/server/supabaseAdmin.ts` — Service-role Supabase client (API only)
- `src/routes/+page.svelte` — Room UI; Supabase Realtime or WebSocket
- `src/routes/api/translate-and-send/+server.ts` — Rate limit, Gemini, insert or broadcast
- `docs/SUPABASE_MIGRATION_OPTION_B.md` — Full migration design (Option B)
- `supabase/migrations/` — Postgres + Realtime setup SQL
