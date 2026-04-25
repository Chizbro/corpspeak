# CorpSpeak — Phased implementation plan

**Goal:** Multi-user chatroom where every message is translated into corporate jargon by an LLM before it appears in the room.

**Stack:** SvelteKit + Svelte 5 (runes only), **Netlify** (adapter-netlify), **Supabase** (Postgres + Realtime), **Google Gemini 2.5 Flash** via `src/routes/api/translate-and-send/+server.ts`.

---

## Current baseline (in repo)

- SvelteKit app with **Supabase** for storage and **Realtime** for live updates.
- **Gemini** translation in the `translate-and-send` API route; only translated text is stored.
- Deployment target: **Netlify**; see [DEPLOY.md](DEPLOY.md) and [MIGRATION_PLAN.md](MIGRATION_PLAN.md).

---

## Phase 1 — Core chat (done)

- [x] SvelteKit + Svelte 5, TypeScript, `@sveltejs/adapter-netlify`
- [x] Single room UI (`/`), display name, message list, send flow
- [x] Supabase schema and migrations; Realtime subscription for `INSERT` on `messages`
- [x] API route: rate limit → Gemini → insert with service role

**Definition of done:** Users can send messages; all clients see translated text in real time; messages persist in Postgres.

---

## Phase 2 — Hardening (optional)

- [ ] Tighten RLS (e.g. reduce anon `SELECT` surface); consider RPC-only insert patterns
- [ ] Stronger rate limiting (e.g. shared store) if you outgrow per-instance memory maps on Netlify Functions
- [ ] Monitoring: Netlify function logs, Supabase metrics

---

## Phase 3 — Product follow-ups (optional)

- [ ] **Rooms:** route like `/room/[id]`, `room_id` on messages
- [ ] **Auth:** Supabase Auth; map identities to `author_name` or user id
- [x] **Retention:** scheduled job to prune old messages (keep 100 newest globally; Supabase RPC + Netlify hourly function)
- [ ] **Prompts:** tunable system prompt and safety filters in the API route

---

## Phase 4 — LLM / ops (optional)

- [ ] Model version pinned and documented; fallback behavior on quota / 429 (partially present)
- [ ] Move calling Gemini to a Supabase Edge Function or external worker if you want to isolate that layer from the SvelteKit function

---

## Summary

| Area | State |
|------|--------|
| UI + API | SvelteKit on Netlify; Gemini in `translate-and-send` |
| Data + realtime | Supabase Postgres + Realtime |
| Next steps | Hardening and features in Phases 2–4 as needed |

For schema and env details, see [docs/SUPABASE.md](docs/SUPABASE.md).
