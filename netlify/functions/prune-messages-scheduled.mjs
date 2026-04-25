import { createClient } from '@supabase/supabase-js';

const DEFAULT_KEEP = 100;

/** @param {Request} _req */
export default async function handler(_req) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('prune-messages-scheduled: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return new Response('Missing Supabase env', { status: 500 });
  }

  const keep = Number(process.env.MESSAGE_RETENTION_KEEP ?? DEFAULT_KEEP);
  const supabase = createClient(url, key, {
    db: { schema: 'corpspeak' },
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data, error } = await supabase.rpc('prune_messages_to_limit', { p_keep: keep });
  if (error) {
    console.error('prune-messages-scheduled RPC error', error);
    return new Response(error.message, { status: 500 });
  }

  console.log('prune-messages-scheduled: deleted rows', data);
  return new Response(JSON.stringify({ deleted: data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
