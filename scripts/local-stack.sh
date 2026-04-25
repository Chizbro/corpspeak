#!/usr/bin/env bash
# Start local Supabase (Docker) and Netlify Dev so SvelteKit + serverless functions match production.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

missing=()
for cmd in supabase netlify; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    missing+=("$cmd")
  fi
done
if ((${#missing[@]})); then
  echo "Install: ${missing[*]}" >&2
  echo "  Supabase CLI: https://supabase.com/docs/guides/cli/getting-started" >&2
  echo "  Netlify CLI:  https://docs.netlify.com/cli/get-started/" >&2
  exit 1
fi

supabase start

# Map local stack keys to the same names the app expects (see .env.example).
eval "$(supabase status -o env)"
export PUBLIC_SUPABASE_URL="$API_URL"
export PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"
export SUPABASE_URL="$API_URL"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"

set -a
if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  source .env
fi
set +a

if [[ -z "${GEMINI_API_KEY:-}" ]]; then
  echo "Warning: GEMINI_API_KEY is unset. Add it to .env for translate-and-send to work." >&2
fi

exec netlify dev
