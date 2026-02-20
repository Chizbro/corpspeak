# CorpSpeak

Multi-user chatroom where every message is translated into corporate jargon (Phase 3). Phase 1–2: scaffold + real-time chat with Convex.

## Stack

- **UI:** SvelteKit + Svelte 5 (runes only)
- **Backend:** Convex
- **LLM:** TBD (Phase 3)

## Setup

1. **Install and run Convex** (creates deployment and `.env.local` with `PUBLIC_CONVEX_URL`):

   ```bash
   npm install
   npx convex dev
   ```

   Log in or sign up when prompted. Convex will create `convex/.env.local` (or add to your `.env.local`) with the deployment URL. Ensure your app sees it as **`PUBLIC_CONVEX_URL`** (SvelteKit uses this for the client).

   If Convex writes `CONVEX_URL` instead, add to `.env` or `.env.local`:

   ```
   PUBLIC_CONVEX_URL=<paste the same URL from CONVEX_URL>
   ```

2. **Run the app:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173). Create the default “General” room, set a display name, and send messages. They appear in real time for all clients (no LLM translation yet).

## Scripts

- `npm run dev` — SvelteKit dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build
- `npx convex dev` — Convex backend dev + codegen (run in a separate terminal)

## Project layout (Phase 1–2)

- `convex/` — Schema, rooms, messages (mutations + queries)
- `src/routes/` — Layout and main chat page (Svelte 5, runes only)
- `src/app.css` — Global styles

Phase 3 will add a Convex action that calls an LLM to translate messages before storing them.
