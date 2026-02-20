import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const createRoom = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('rooms', {
      name: args.name,
      createdAt: Date.now()
    });
    return id;
  }
});

export const listRooms = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('rooms').withIndex('by_created').order('asc').collect();
  }
});
