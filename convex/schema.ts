import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { Arena } from "./schema/arena"
import { Match } from "./schema/match"
import { User } from "./schema/user"

export const schema = defineSchema({
  ...authTables,
  users: defineTable(User)
    .index("by_email", ["email"])
    .index("by_username", ["username"]),

  arenas: defineTable(Arena),
  matches: defineTable(Match)
    .index("by_arena", ["arenaId"])
    .index("by_user", ["userId"])
    .index("by_user_and_arena", ["userId", "arenaId"])
})
