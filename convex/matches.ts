import { v } from "convex/values"
import { internalMutation } from "./_generated/server"

export const record = internalMutation({
  args: {
    arenaId: v.id("arenas"),
    results: v.array(
      v.object({
        userId: v.id("users"),
        rank: v.number(),
        score: v.number(),
        artifact: v.string()
      })
    )
  },
  handler: async (ctx, args) => {
    const arena = await ctx.db.get(args.arenaId)
    if (!arena) throw new Error("Arena not found")
    const type = arena.type

    for (const result of args.results) {
      await ctx.db.insert("matches", {
        arenaId: args.arenaId,
        userId: result.userId,
        rank: result.rank,
        score: result.score,
        artifact: result.artifact
      })

      // Update user stats
      const user = await ctx.db.get(result.userId)
      if (user) {
        // Initialize stats if not present
        const currentStats = user.stats || {
          draw: { wins: 0, played: 0 },
          code: { wins: 0, played: 0 },
          typing: { wins: 0, played: 0 }
        }

        currentStats[type].played += 1
        if (result.rank === 1) {
          currentStats[type].wins += 1
        }

        await ctx.db.patch(result.userId, { stats: currentStats })
      }
    }
  }
})
