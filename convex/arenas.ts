import { getAuthUserId } from "@convex-dev/auth/server"
import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"
import { internalMutation, mutation, query } from "./_generated/server"
import { MODE_CONFIG } from "./schema/arena"

export const create = mutation({
  args: {
    type: v.union(v.literal("draw"), v.literal("code"), v.literal("typing")),
    mode: v.union(v.literal("solo"), v.literal("pvp"), v.literal("duo")),
    maxPlayers: v.number(),
    timeLimit: v.number(),
    isPublic: v.boolean(),
    prompt: v.string()
  },
  returns: v.id("arenas"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not Authenticated"
      })
    }
    const modeConfig = MODE_CONFIG[args.mode]
    if (
      modeConfig.minPlayers > args.maxPlayers ||
      args.maxPlayers > modeConfig.maxPlayers
    ) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Invalid player count",
        data: {
          minPlayers: modeConfig.minPlayers,
          maxPlayers: modeConfig.maxPlayers,
          currentPlayers: args.maxPlayers
        }
      })
    }
    const arenaId = await ctx.db.insert("arenas", {
      hostId: userId,
      isPublic: args.isPublic,
      status: "lobby",
      type: args.type,
      mode: args.mode,
      settings: {
        maxPlayers: args.maxPlayers,
        timeLimit: args.timeLimit,
        prompt: args.prompt
      },
      participants: [userId]
    })
    return arenaId
  }
})

export const get = query({
  args: { arenaId: v.id("arenas") },
  returns: v.object({
    _id: v.id("arenas"),
    _creationTime: v.number(),
    hostId: v.id("users"),
    isPublic: v.boolean(),
    status: v.union(
      v.literal("lobby"),
      v.literal("active"),
      v.literal("ended")
    ),
    type: v.union(v.literal("draw"), v.literal("code"), v.literal("typing")),
    mode: v.union(v.literal("solo"), v.literal("pvp"), v.literal("duo")),
    settings: v.object({
      maxPlayers: v.number(),
      timeLimit: v.number(),
      prompt: v.string()
    }),
    participants: v.array(v.id("users")),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number())
  }),
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
  returns: v.id("arenas"),
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
    if (arena.status !== "lobby")
      throw new ConvexError({
        code: "BAD_REQUEST",
        message:
          arena.status === "active" ? "Arena is in progress" : "Arena ended"
      })

    if (arena.participants.includes(userId)) return arena._id

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
    return args.arenaId
  }
})

export const leave = mutation({
  args: { arenaId: v.id("arenas") },
  returns: v.null(),
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
    if (!arena.participants.includes(userId))
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "You are not a participant of this arena"
      })
    if (arena.hostId === userId && arena.status === "lobby") {
      await ctx.db.patch(args.arenaId, { status: "ended", endedAt: Date.now() })
      return
    }
    await ctx.db.patch(args.arenaId, {
      participants: arena.participants.filter((id) => id !== userId)
    })
  }
})

export const start = mutation({
  args: { arenaId: v.id("arenas") },
  returns: v.null(),
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
    if (arena.hostId !== userId)
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "You are not the host of this arena"
      })
    if (arena.status !== "lobby")
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Arena is not in lobby"
      })
    const modeConfig = MODE_CONFIG[arena.mode]
    if (arena.participants.length < modeConfig.minPlayers)
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Not enough players to start the arena"
      })

    await ctx.db.patch(args.arenaId, {
      status: "active",
      startedAt: Date.now()
    })
  }
})

export const listOpenLobbies = query({
  args: {
    paginationOpts: paginationOptsValidator
  },
  returns: v.object({
    openLobbiesWithHost: v.array(
      v.object({
        _id: v.id("arenas"),
        hostId: v.id("users"),
        isPublic: v.boolean(),
        status: v.union(
          v.literal("lobby"),
          v.literal("active"),
          v.literal("ended")
        ),
        type: v.union(
          v.literal("draw"),
          v.literal("code"),
          v.literal("typing")
        ),
        mode: v.union(v.literal("solo"), v.literal("pvp"), v.literal("duo")),
        settings: v.object({
          maxPlayers: v.number(),
          timeLimit: v.number(),
          prompt: v.string()
        }),
        participants: v.array(v.id("users")),
        startedAt: v.optional(v.number()),
        endedAt: v.optional(v.number()),
        hostName: v.string()
      })
    ),
    continueCursor: v.optional(v.string()),
    isDone: v.boolean()
  }),
  handler: async (ctx, args) => {
    const pagination = await ctx.db
      .query("arenas")
      .withIndex("by_public_status", (q) =>
        q.eq("isPublic", true).eq("status", "lobby")
      )
      .paginate({
        cursor: args.paginationOpts.cursor ?? null,
        numItems: args.paginationOpts.numItems
      })
    const openLobbies = pagination.page

    const openLobbiesWithHost = await Promise.all(
      openLobbies.map(async (lobby) => {
        const host = await ctx.db.get(lobby.hostId)
        if (!host) return null
        return {
          ...lobby,
          hostName: host.username ?? "Unknown"
        }
      })
    ).then((lobbies) =>
      lobbies.filter((l): l is NonNullable<typeof l> => l !== null)
    )

    return {
      openLobbiesWithHost,
      continueCursor: pagination.continueCursor,
      isDone: pagination.isDone
    }
  }
})

export const getParticipants = query({
  args: { arenaId: v.id("arenas") },
  returns: v.object({
    participants: v.array(
      v.object({
        _id: v.id("users"),
        username: v.string()
      })
    ),
    hostId: v.id("users")
  }),
  handler: async (ctx, args) => {
    const arena = await ctx.db.get(args.arenaId)
    if (!arena)
      throw new ConvexError({ code: "NOT_FOUND", message: "Arena not found" })

    const participants = await Promise.all(
      arena.participants.map(async (participantId) => {
        const participant = await ctx.db.get(participantId)
        if (!participant) return null
        return {
          _id: participant._id,
          username: participant.username ?? "Unknown"
        }
      })
    )
    return {
      participants: participants.filter(
        (p): p is NonNullable<typeof p> => p !== null
      ),
      hostId: arena.hostId
    }
  }
})

export const markEnded = internalMutation({
  args: { arenaId: v.id("arenas") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const arena = await ctx.db.get(args.arenaId)
    if (!arena || arena.status === "ended") {
      return
    }
    await ctx.db.patch(args.arenaId, { status: "ended", endedAt: Date.now() })
  }
})

export const finalizeFromDO = internalMutation({
  args: {
    arenaId: v.id("arenas"),
    endReason: v.union(
      v.literal("completed"),
      v.literal("abandoned"),
      v.literal("host_ended")
    ),
    duration: v.number(),
    participants: v.array(
      v.object({
        id: v.string(),
        username: v.string(),
        score: v.optional(v.number())
      })
    ),
    finalElements: v.optional(v.array(v.any()))
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const arena = await ctx.db.get(args.arenaId)
    if (!arena) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Arena not found" })
    }

    if (arena.status === "ended") {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Arena already ended"
      })
    }

    await ctx.db.patch(args.arenaId, {
      status: "ended",
      endedAt: Date.now()
    })
  }
})
