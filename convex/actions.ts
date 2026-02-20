import { action } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

const SYSTEM_PROMPT = `You are a translator. Given a user message, rewrite it in mindless corporate jargon: buzzwords, passive voice, and business-speak. Respond with only the translated text, no explanation.`;

const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_RETRIES = 2;

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

export const translateAndSend = action({
  args: {
    roomId: v.id('rooms'),
    rawBody: v.string(),
    authorName: v.string(),
    clientId: v.string()
  },
  handler: async (ctx, args) => {
    const { allowed } = await ctx.runMutation(
      internal.rateLimit.checkAndUpdate,
      { clientId: args.clientId }
    );
    if (!allowed) {
      throw new Error(
        'Rate limit: please wait at least 1 second between messages.'
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not set. Set it with: npx convex env set GEMINI_API_KEY <your-key>'
      );
    }

    let lastRes: Response | null = null;
    let lastErrBody = '';

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: 'user', parts: [{ text: args.rawBody }] }],
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
          data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? args.rawBody;

        await ctx.runMutation(internal.messages.insertMessage, {
          roomId: args.roomId,
          body: translated,
          authorName: args.authorName
        });
        return;
      }

      if (res.status === 429 && attempt < MAX_RETRIES) {
        const waitSec = parseRetryDelaySeconds(lastErrBody);
        await new Promise((r) => setTimeout(r, waitSec * 1000));
        continue;
      }

      break;
    }

    const quotaHint =
      lastRes?.status === 429
        ? ' Gemini free tier quota exceeded. Check https://ai.google.dev/gemini-api/docs/rate-limits or enable billing for higher limits.'
        : '';
    throw new Error(`Gemini API error: ${lastRes?.status ?? 'unknown'} ${lastErrBody}${quotaHint}`);
  }
});
