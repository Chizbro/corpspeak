#!/usr/bin/env node
/**
 * One-off retention run against whatever SUPABASE_* URLs are in the environment.
 * Usage: node --env-file=.env scripts/prune-once.mjs
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const keep = Number(process.env.MESSAGE_RETENTION_KEEP ?? '100');

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const { data, error } = await supabase.rpc('prune_messages_to_limit', { p_keep: keep });
if (error) {
  console.error(error);
  process.exit(1);
}
console.log('prune_messages_to_limit: deleted', data, 'row(s)');
