import { env as privateEnv } from '$env/dynamic/private';
import { getSupabaseAdmin, type InsertedMessageRow } from '$lib/server/supabaseAdmin';
import type { RequestHandler } from './$types';

const SYSTEM_PROMPT = `You are a translator. Given a user message, rewrite it in mindless corporate jargon: buzzwords, passive voice, and business-speak. Respond with only the translated text, no explanation.`;

const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_RETRIES = 2;
const RATE_LIMIT_MS = 1000;

const rateLimitMap = new Map<string, number>();

function parseRetryDelaySeconds(errBody: string): number {
  try {
    const parsed = JSON.parse(errBody) as {
      error?: { details?: Array<{ '@type'?: string; retryDelay?: string }> };
    };
    const retryInfo = parsed.error?.details?.find(
      (d) => d['@type']?.includes('RetryInfo')
    );
    const delay = retryInfo?.retryDelay;
    if (typeof delay === 'string') {
      const match = delay.match(/^(\d+(?:\.\d+)?)s$/);
      if (match) return Math.ceil(parseFloat(match[1]));
    }
  } catch {
    /* ignore */
  }
  return 60;
}

export const POST: RequestHandler = async (event) => {
  const platform = event.platform as { env?: Record<string, string> } | undefined;
  const envVars = (platform?.env ?? privateEnv) as Record<string, string | undefined>;
  const geminiApiKey = envVars.GEMINI_API_KEY ?? '';

  if (!geminiApiKey) {
    return new Response(
      JSON.stringify({ error: 'GEMINI_API_KEY is not set' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: { rawBody: string; authorName: string; clientId: string };
  try {
    body = await event.request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { rawBody, authorName, clientId } = body;
  if (typeof rawBody !== 'string' || !authorName || !clientId) {
    return new Response(
      JSON.stringify({ error: 'Missing rawBody, authorName, or clientId' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const now = Date.now();
  const lastSent = rateLimitMap.get(clientId);
  if (lastSent != null && now - lastSent < RATE_LIMIT_MS) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit: please wait at least 1 second between messages.'
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }
  rateLimitMap.set(clientId, now);

  let lastRes: Response | null = null;
  let lastErrBody = '';

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: rawBody }] }],
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7
          }
        })
      }
    );

    lastRes = res;
    lastErrBody = await res.text();

    if (res.ok) {
      const data = JSON.parse(lastErrBody) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      const translated =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? rawBody;

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return new Response(
          JSON.stringify({
            error:
              'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see README).'
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const { data: row, error: insertError } = await supabase
        .from('messages')
        .insert({
          room_id: 'general',
          author_name: authorName,
          body: translated
        })
        .select('id, room_id, author_name, body, created_at')
        .single<InsertedMessageRow>();

      if (insertError) {
        return new Response(
          JSON.stringify({ error: `Supabase: ${insertError.message}` }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (!row) {
        return new Response(
          JSON.stringify({ error: 'Supabase: insert returned no row' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const payload = {
        id: row.id,
        author_name: row.author_name,
        body: row.body,
        created_at: row.created_at
      };
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (res.status === 429 && attempt < MAX_RETRIES) {
      const waitSec = parseRetryDelaySeconds(lastErrBody);
      await new Promise((r) => setTimeout(r, waitSec * 1000));
      continue;
    }

    break;
  }

  const quotaHint =
    lastRes?.status === 429 ? ' Gemini free tier quota exceeded.' : '';
  return new Response(
    JSON.stringify({
      error: `Gemini API error: ${lastRes?.status ?? 'unknown'} ${lastErrBody}${quotaHint}`
    }),
    { status: 502, headers: { 'Content-Type': 'application/json' } }
  );
};
