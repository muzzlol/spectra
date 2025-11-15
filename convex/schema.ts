import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { User } from "./schema/user"

const schema = defineSchema({
  ...authTables,
  users: defineTable(User)
    .index("by_email", ["email"])
    .index("by_username", ["username"]),
  numbers: defineTable({
    value: v.number()
  })
})

export default schema
