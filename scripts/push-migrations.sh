#!/usr/bin/env bash
# Apply supabase/migrations to the linked Supabase project before the app build (Netlify).
# Requires SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF. Set SUPABASE_DB_PASSWORD
# in CI if the CLI cannot connect (see https://supabase.com/docs/reference/cli/supabase-link).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ "${NETLIFY:-}" = "true" ]; then
  if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ] || [ -z "${SUPABASE_PROJECT_REF:-}" ]; then
    echo "Error: Netlify needs SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF in site env so migrations run before the build."
    echo "Add them under Site configuration → Environment variables (see DEPLOY.md)."
    exit 1
  fi
else
  if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ] || [ -z "${SUPABASE_PROJECT_REF:-}" ]; then
    echo "Skipping Supabase db push (set SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF to push migrations from this environment)."
    exit 0
  fi
fi

if [ -n "${SUPABASE_DB_PASSWORD:-}" ]; then
  export SUPABASE_DB_PASSWORD
fi
export SUPABASE_ACCESS_TOKEN

echo "Linking Supabase project ${SUPABASE_PROJECT_REF} and pushing migrations..."
npx supabase link --project-ref "$SUPABASE_PROJECT_REF" --yes
npx supabase db push --yes
echo "Supabase migrations are up to date."
