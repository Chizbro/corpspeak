# CorpSpeak

Ephemeral chatroom: every message is translated into corporate jargon and shown only to people in the room at that moment. **Nothing is stored** — you only see messages received since you joined. Real-time is handled by a WebSocket server (no third-party service).

## Stack

- **UI:** SvelteKit + Svelte 5 (runes only)
- **Host:** Node (adapter-node); deploy on **Render** or any Node host
- **Real-time:** In-process WebSocket on `/ws` (no Pusher/Ably)
- **LLM:** Google Gemini 2.0 Flash (via SvelteKit API route)

## Setup

1. **Env**

   Copy `.env.example` to `.env` and set:

   ```
   GEMINI_API_KEY=<key from https://aistudio.google.com/apikey>
   ```

2. **Run locally**

   **Option A — full app (one process, real-time works):**

   ```bash
   npm install
   npm run build
   npm start
   ```

   Opens [http://localhost:3000](http://localhost:3000). One Node process serves the app, the API, and the WebSocket. All connected clients see messages in real time.

   **Option B — dev server (frontend + API only, no WebSocket):**

   ```bash
   npm run dev
   ```

   Good for UI work. You’ll see your own messages (API returns them), but other tabs/clients won’t get real-time updates. Use `npm run build && npm start` to test multi-client real-time.

## Deploy on Render

1. Create a **Web Service** and connect your repo.
2. **Build command:** `npm run build`
3. **Start command:** `npm start`
4. **Environment:** Add `GEMINI_API_KEY` in the Render dashboard.
5. Render sets `PORT`; the app uses it automatically.

See [DEPLOY.md](DEPLOY.md) for step-by-step Render instructions.

## Scripts

- `npm run dev` — SvelteKit dev server (no WebSocket in dev; use `npm run build && npm start` to test real-time)
- `npm run build` — Production build
- `npm start` — Run the Node server (build + WebSocket on `/ws`)

## Project layout

- `server.js` — Custom Node server: SvelteKit handler + WebSocket on `/ws`; sets `globalThis.__corpspeak_broadcast` for the API route
- `src/lib/ws-clients.js` — Shared client set and broadcast (used by server.js)
- `src/routes/+page.svelte` — Single room “General”, WebSocket client, message list (ephemeral)
- `src/routes/api/translate-and-send/+server.ts` — Rate limit (in-memory), Gemini, broadcast via globalThis
