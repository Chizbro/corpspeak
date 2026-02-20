import { internalMutation } from './_generated/server';
import { v } from 'convex/values';

const RATE_LIMIT_MS = 1000; // 1 second per client

/**
 * Returns { allowed: true } and updates lastSentAt, or { allowed: false } if client sent within the last second.
 */
export const checkAndUpdate = internalMutation({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query('rateLimits')
      .withIndex('by_clientId', (q) => q.eq('clientId', args.clientId))
      .first();

    if (existing) {
      if (now - existing.lastSentAt < RATE_LIMIT_MS) {
        return { allowed: false };
      }
      await ctx.db.patch(existing._id, { lastSentAt: now });
      return { allowed: true };
    }

    await ctx.db.insert('rateLimits', {
      clientId: args.clientId,
      lastSentAt: now
    });
    return { allowed: true };
  }
});
