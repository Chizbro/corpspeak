# CorpSpeak — Phased Implementation Plan

**Goal:** Multi-user chatroom where every message is translated into corporate jargon by an LLM before posting.

**Stack:** SvelteKit + Svelte 5 (runes only), Convex.dev backend, LLM TBD.

---

## Phase 1: Scaffold the App

### 1.1 SvelteKit + Svelte 5

- [ ] Create SvelteKit app (e.g. `npm create svelte@latest .` or new dir), choose:
  - Svelte 5
  - TypeScript
  - No adapters or add later (e.g. `adapter-static` or `adapter-node` for deployment)
- [ ] Enforce Svelte 5 runes only: no `$:` reactive declarations; use `$state`, `$derived`, `$effect`, `$props` where needed.
- [ ] Add minimal global styles and a simple layout (e.g. single chat view shell).

### 1.2 Convex

- [ ] Install Convex: `npx convex dev` (or `npm create convex@latest`) and follow prompts to init in this repo.
- [ ] Ensure Convex dashboard is linked and `.env.local` (or Convex env) has any required keys (none needed for basic chat).
- [ ] Add Convex client in the SvelteKit app (e.g. in `src/lib/convex.ts` or similar) and wrap the app so one Convex provider/client is used app-wide (e.g. root layout or hook).

### 1.3 Project structure (suggested)

```
corpspeak/
├── convex/           # Convex backend
│   ├── schema.ts
│   ├── messages.ts
│   ├── rooms.ts
│   └── _generated/
├── src/
│   ├── lib/
│   │   ├── convex.ts
│   │   └── components/
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +page.svelte
│   │   └── +page.server.ts (if needed)
│   └── app.d.ts
├── static/
├── TECH_STACK.md
├── DESCRIPTION.md
└── PLAN.md (this file)
```

### 1.4 Definition of done (Phase 1)

- SvelteKit app runs with Svelte 5 and runes-only patterns.
- Convex project is linked and `convex dev` runs without errors.
- One Convex client is used in the app (e.g. via a shared module or layout).
- Basic layout exists (e.g. a single page with a placeholder for the chat UI).

---

## Phase 2: Basic Multi-User Chat Room (Convex)

### 2.1 Data model (Convex schema)

- [ ] **Rooms** (optional but useful for “one main room” or future multi-room):
  - `_id`, `name`, `createdAt` (or similar).
- [ ] **Messages:**
  - `_id`, `roomId`, `body` (final text shown in room — “corp speak”),
  - `authorId` or `authorName` (identifier for display),
  - `createdAt`.
- [ ] **Users / identity (minimal):**
  - Use Convex auth when ready, or for MVP store a simple `authorName` (or `authorId`) on each message so multi-user is visible.

Decide up front: single global room vs multiple rooms; implement schema and APIs accordingly.

### 2.2 Convex API

- [ ] **Mutations:**
  - `sendMessage(roomId, body)` — in Phase 3, `body` will be the *translated* message; for Phase 2, `body` is the raw message (no LLM yet).
  - Optionally: `createRoom(name)` if you support multiple rooms.
- [ ] **Queries:**
  - `listMessages(roomId)` — returns messages for a room, ordered by time (e.g. `createdAt` asc/desc).
- [ ] Use Convex’s reactive queries in the UI so the chat updates in real time as messages are added.

### 2.3 UI (Svelte 5, runes only)

- [ ] **Room view:**
  - One main route (e.g. `/` or `/room/[id]`) that shows message list and an input.
- [ ] **Message list:**
  - Subscribe to `listMessages(roomId)` and render messages (author, body, time) using `$derived` / `$state` as needed; no `$:`.
- [ ] **Input + send:**
  - Input field and “Send” (or submit) that calls `sendMessage(roomId, body)` with current input; clear input on success.
- [ ] **Identity (MVP):**
  - Either Convex auth (e.g. anonymous or email) and use `ctx.auth.getUserIdentity()` in mutations, or a simple “Display name” field stored in session/localStorage and sent with each message. Prefer Convex auth for a clean multi-user story.

### 2.4 Definition of done (Phase 2)

- Users can open the app, see a single chat room (or default room).
- Messages are stored in Convex and appear in real time for all clients.
- Sender is identifiable (name or id); no LLM translation yet — raw message is posted.

---

## Phase 3: Integrate the LLM Component

### 3.1 LLM discovery and choice

- [ ] **Options to evaluate:**
  - **OpenAI** (e.g. GPT-4o-mini or GPT-4): simple API, good for “translate to corporate jargon” prompts.
  - **Anthropic (Claude):** alternative, similar use case.
  - **Vercel AI SDK / Convex actions:** run LLM in a Convex action (or external API) so translation happens server-side before writing to DB.
- [ ] **Decision:** Pick one provider and one model; document in `TECH_STACK.md` under “AGENT” (e.g. “OpenAI GPT-4o-mini via Convex action”).

### 3.2 Flow design

- **Current (Phase 2):** Client → `sendMessage(roomId, body)` → Convex stores `body` as-is.
- **Target (Phase 3):**
  1. Client sends “raw” message (e.g. `submitRawMessage(roomId, rawBody)` or keep `sendMessage` but pass raw text).
  2. Backend (Convex action or HTTP action) calls LLM with a system/user prompt like: “Translate the following into mindless corporate jargon. Output only the translated text.”
  3. LLM returns translated text; backend writes one message to Convex with `body = translatedText`, plus `authorId`/`authorName` and `roomId`, `createdAt`.

Keep a single source of truth: only the translated message is stored (no need to store raw unless you want “show original” later).

### 3.3 Convex changes

- [ ] **Action (recommended):** e.g. `convex/actions.ts` (or `translateAndSend.ts`):
  - Input: `roomId`, `rawBody`, `authorId`/`authorName`.
  - Steps: call LLM API (OpenAI/Anthropic) with prompt to translate to corporate jargon; on success, call a mutation (e.g. `insertMessage(roomId, translatedBody, authorId/authorName)`).
  - Use Convex secrets for API keys (e.g. `OPENAI_API_KEY`).
- [ ] **Mutation:** Either reuse `sendMessage` as internal (only callable from action) or add `insertMessage` used only by the action. Client never writes directly to messages for user content in Phase 3.
- [ ] **Client:** Replace direct `sendMessage(roomId, body)` with calling the new action (e.g. `submitRawMessage(roomId, rawBody)`). Optionally show “Translating…” state while the action runs.

### 3.4 Prompt and behavior

- [ ] **System prompt (example):** “You are a translator. Given a user message, rewrite it in mindless corporate jargon: buzzwords, passive voice, and business-speak. Respond with only the translated text, no explanation.”
- [ ] **User prompt:** The user’s raw message.
- [ ] Tune for tone (more/less absurd) and length; keep response as a single message body.

### 3.5 Definition of done (Phase 3)

- User types a message and submits.
- Message is sent to Convex action → LLM translates to corporate jargon → translated message is stored and broadcast to the room.
- All participants see only the translated (corp-speak) message in real time.
- API keys are in Convex secrets; no keys in client code.
- `TECH_STACK.md` updated with chosen LLM provider and pattern (e.g. “OpenAI via Convex action”).

---

## Summary

| Phase | Focus | Outcome |
|-------|--------|--------|
| **1** | Scaffold | SvelteKit (Svelte 5, runes) + Convex wired and running; clean project structure. |
| **2** | Chat room | Multi-user real-time chat: list messages, send message, identity; no LLM. |
| **3** | LLM | Convex action calls LLM to translate → store only translated message; client submits raw text. |

After Phase 3 you can iterate on prompts, add multiple rooms, or add “show original” by storing raw + translated if desired.
