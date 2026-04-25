# UI: SvelteKit and Svelte 5
# HOST: Netlify (@sveltejs/adapter-netlify); see netlify.toml and DEPLOY.md
# REAL-TIME: Supabase Realtime (postgres_changes on corpspeak.messages)
# DATA: Supabase Postgres; server writes with service role in API route
# LLM: Google Gemini 2.5 Flash via src/routes/api/translate-and-send (+server.ts). Set GEMINI_API_KEY (https://aistudio.google.com/apikey)

DO NOT USE SVELTE 4
YOU MUST USE RUNES SYNTAX
REACTIVE DECLARATIONS LIKE $: ARE BANNED
