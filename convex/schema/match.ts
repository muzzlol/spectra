import { v } from "convex/values"

export const Match = v.object({
  arenaId: v.id("arenas"),
  userId: v.id("users"),
  teamId: v.optional(v.id("teams")),
  rank: v.number(),
  score: v.number(),
  artifact: v.string()
})
