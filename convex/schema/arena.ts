import { v } from "convex/values"

export const Arena = v.object({
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
})
