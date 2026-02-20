import { mutation, internalMutation, query } from './_generated/server';
import { v } from 'convex/values';

/** Internal: only used by the translateAndSend action to store the LLM-translated message. */
export const insertMessage = internalMutation({
  args: {
    roomId: v.id('rooms'),
    body: v.string(),
    authorName: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('messages', {
      roomId: args.roomId,
      body: args.body,
      authorName: args.authorName,
      createdAt: Date.now()
    });
  }
});

export const listMessages = query({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('messages')
      .withIndex('by_room_created', (q) => q.eq('roomId', args.roomId))
      .order('asc')
      .collect();
  }
});

/** Delete all messages. Run from Convex dashboard (Functions → messages → clearAllMessages) to clear the table. */
export const clearAllMessages = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('messages').collect();
    for (const doc of all) {
      await ctx.db.delete(doc._id);
    }
    return { deleted: all.length };
  }
});
