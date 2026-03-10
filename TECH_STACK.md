# UI: SvelteKit and Svelte 5
# HOST: Node (adapter-node); deploy on Render (or any Node host)
# REAL-TIME: In-process WebSocket on /ws (server.js + src/lib/ws-clients.js); no Pusher/Ably
# AGENT: Google Gemini 2.0 Flash via SvelteKit API route (src/routes/api/translate-and-send/+server.ts). Set GEMINI_API_KEY (get a key at https://aistudio.google.com/apikey)

DO NOT USE SVELTE 4
YOU MUST USE RUNES SYNTAX
REACTIVE DECLARATIONS LIKE $: ARE BANNED
