import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  rooms: defineTable({
    name: v.string(),
    createdAt: v.number()
  }).index('by_created', ['createdAt']),

  messages: defineTable({
    roomId: v.id('rooms'),
    body: v.string(),
    authorName: v.string(),
    createdAt: v.number()
  }).index('by_room', ['roomId']).index('by_room_created', ['roomId', 'createdAt']),

  rateLimits: defineTable({
    clientId: v.string(),
    lastSentAt: v.number()
  }).index('by_clientId', ['clientId'])
});
