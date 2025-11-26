import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, v } from "convex/values"
import { internalMutation, mutation, query } from "./_generated/server"

export const create = mutation({
  args: {
    type: v.union(v.literal("draw"), v.literal("code"), v.literal("typing")),
    mode: v.union(v.literal("solo"), v.literal("pvp"), v.literal("duo")),
    maxPlayers: v.number(),
    timeLimit: v.number(),
    prompt: v.string()
  },
  handler: async (ctx, args) => {
    const arenaId = await ctx.db.insert("arenas", {
      type: args.type,
      mode: args.mode,
      settings: {
        maxPlayers: args.maxPlayers,
        timeLimit: args.timeLimit,
        prompt: args.prompt
      },
      participants: []
    })
    return arenaId
  }
})

export const get = query({
  args: { arenaId: v.id("arenas") },
  handler: async (ctx, args) => {
    const arena = await ctx.db.get(args.arenaId)
    if (!arena)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Arena not found"
      })
    return arena
  }
})

export const join = mutation({
  args: { arenaId: v.id("arenas") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId)
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not Authenticated"
      })

    const arena = await ctx.db.get(args.arenaId)
    if (!arena)
      throw new ConvexError({ code: "NOT_FOUND", message: "Arena not found" })
    if (arena.endedAt)
      throw new ConvexError({ code: "BAD_REQUEST", message: "Game ended" })
    if (arena.startedAt)
      throw new ConvexError({ code: "BAD_REQUEST", message: "Game started" })

    if (arena.participants.includes(userId)) return

    if (arena.participants.length >= arena.settings.maxPlayers) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Lobby full",
        data: {
          maxPlayers: arena.settings.maxPlayers,
          currentPlayers: arena.participants.length
        }
      })
    }

    await ctx.db.patch(args.arenaId, {
      participants: [...arena.participants, userId]
    })
  }
})

export const markActive = internalMutation({
  args: { arenaId: v.id("arenas") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.arenaId, { startedAt: Date.now() })
  }
})

export const markEnded = internalMutation({
  args: { arenaId: v.id("arenas") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.arenaId, { endedAt: Date.now() })
  }
})
