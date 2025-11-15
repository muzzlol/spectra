import { v } from "convex/values"

export const User = v.object({
  username: v.optional(v.string()),
  isAnonymous: v.boolean(),
  email: v.optional(v.string()),
  picture: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number())
})
