import { v } from "convex/values"
export const Arena = v.object({
  hostId: v.id("users"),
  type: v.union(v.literal("draw"), v.literal("code"), v.literal("typing")),
  mode: v.union(v.literal("solo"), v.literal("pvp")),
  status: v.union(v.literal("lobby"), v.literal("active"), v.literal("ended")),
  isPublic: v.boolean(),
  settings: v.object({
    maxPlayers: v.number(),
    timeLimit: v.number(),
    prompt: v.string()
  }),
  participants: v.array(v.id("users")),
  startedAt: v.optional(v.number()),
  endedAt: v.optional(v.number())
})

export type Arena = typeof Arena.type
export type ArenaType = Arena["type"]
export type ArenaMode = Arena["mode"]
export type ArenaStatus = Arena["status"]

export const MODE_CONFIG: Record<
  ArenaMode,
  {
    label: Capitalize<ArenaMode> | string
    maxPlayers: number
    minPlayers: number
    showPlayerInput: boolean
  }
> = {
  solo: { label: "Solo", maxPlayers: 1, minPlayers: 1, showPlayerInput: false },
  pvp: { label: "PvP", maxPlayers: 4, minPlayers: 2, showPlayerInput: true }
}
