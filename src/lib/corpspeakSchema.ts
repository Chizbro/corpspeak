/**
 * All Corpspeak database objects (tables, RPC, Realtime) live in this Postgres schema so they
 * stay isolated from other services sharing the same Supabase project/database.
 */
export const CORPSPEAK_POSTGRES_SCHEMA = 'corpspeak' as const;

export const supabaseDbOptions = { schema: CORPSPEAK_POSTGRES_SCHEMA } as const;
