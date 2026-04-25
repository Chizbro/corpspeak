import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

let cached: SupabaseClient | null | undefined;

/** Service-role client for API routes. Returns null if Supabase is not configured. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    cached = null;
    return null;
  }
  cached = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  return cached;
}

export type InsertedMessageRow = {
  id: string;
  room_id: string;
  author_name: string;
  body: string;
  created_at: string;
};
