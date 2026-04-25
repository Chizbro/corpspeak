import { env } from '$env/dynamic/private';
import { CORPSPEAK_BOOTSTRAP_SQL } from './corpspeakBootstrapSql';

function getPostgresUrl(): string | undefined {
  const a = env.SUPABASE_DB_URL;
  if (typeof a === 'string' && a.length > 0) return a;
  if (typeof process !== 'undefined' && process.env.SUPABASE_DB_URL)
    return process.env.SUPABASE_DB_URL;
  return undefined;
}

let schemaReady = false;
let inFlight: Promise<void> | null = null;

/**
 * If `SUPABASE_DB_URL` is set (Postgres connection string, preferably direct
 * 5432 or session mode — not transaction-pooled pgbouncer for DDL), run
 * idempotent SQL so `corpspeak` and `corpspeak.messages` exist. No-op
 * when the variable is unset.
 *
 * The Supabase project must still list `corpspeak` under Data API → Exposed
 * schemas, or PostgREST returns PGRST106; that cannot be changed from the app.
 */
export function ensureCorpspeakSchemaIfDbUrlSet(): Promise<void> {
  if (schemaReady) return Promise.resolve();
  if (inFlight) return inFlight;
  const url = getPostgresUrl();
  if (!url) return Promise.resolve();
  inFlight = runBootstrap(url)
    .then(() => {
      schemaReady = true;
    })
    .catch((err) => {
      inFlight = null;
      throw err;
    });
  return inFlight;
}

async function runBootstrap(connectionString: string): Promise<void> {
  const { default: pg } = await import('pg');
  const client = new pg.Client({ connectionString, connectionTimeoutMillis: 15_000 });
  try {
    await client.connect();
    await client.query(CORPSPEAK_BOOTSTRAP_SQL);
  } finally {
    await client.end().catch(() => {
      /* ignore */
    });
  }
}

export function supabaseDataApiHint(
  err: { code?: string; message?: string; hint?: string } | null | undefined
): string {
  if (!err) return '';
  const code = err.code ?? '';
  const m = (err.message ?? '').toLowerCase();
  if (
    code === 'PGRST106' ||
    (m.includes('schema') && (m.includes('invalid') || m.includes('must be one')))
  ) {
    return ' In the Supabase dashboard, open Project Settings → Data API and add the schema `corpspeak` to the exposed schemas (alongside public). You may also need to run the SQL in supabase/migrations/ or set SUPABASE_DB_URL so the server can create objects automatically.';
  }
  return '';
}
