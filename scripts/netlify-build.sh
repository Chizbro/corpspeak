#!/usr/bin/env bash
# Netlify build: apply Supabase migrations to the linked remote project, then SvelteKit build.
# Uses the official Supabase CLI (https://supabase.com/docs/reference/cli).
set -euo pipefail

run_db_push() {
  echo "netlify: linking project ${SUPABASE_PROJECT_REF} and running supabase db push"
  npx supabase link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD" --yes
  npx supabase db push --yes
}

# Production deploy: always push pending migrations (requires secrets below).
# Other contexts: skip unless explicitly opted in, so PR/branch deploys do not hit prod DB.
if [ "${SUPABASE_SKIP_DB_PUSH:-}" = "1" ] || [ "${SUPABASE_SKIP_DB_PUSH:-}" = "true" ]; then
  echo "netlify: SUPABASE_SKIP_DB_PUSH is set, skipping supabase db push"
elif [ "${CONTEXT:-}" = "production" ] || \
     [ "${SUPABASE_DB_PUSH:-}" = "1" ] || \
     [ "${SUPABASE_DB_PUSH:-}" = "true" ]; then
  if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ] || [ -z "${SUPABASE_PROJECT_REF:-}" ] || [ -z "${SUPABASE_DB_PASSWORD:-}" ]; then
    if [ "${CONTEXT:-}" = "production" ]; then
      echo "netlify: production deploy requires SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, and SUPABASE_DB_PASSWORD for supabase link / db push" >&2
      exit 1
    fi
    echo "netlify: SUPABASE_DB_PUSH is set but Supabase CLI secrets are missing; skipping db push" >&2
  else
    run_db_push
  fi
else
  echo "netlify: skipping supabase db push (not CONTEXT=production; set SUPABASE_DB_PUSH=1 to run on this deploy)"
fi

exec npm run build
