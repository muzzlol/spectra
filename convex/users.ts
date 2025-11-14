import { v } from "convex/values"
import type { QueryCtx } from "./_generated/server"
import { query } from "./_generated/server"

export const isUsernameAvailable = query({
  args: { username: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("username"), args.username))
      .first()
    return !existing
  }
})

export async function getUserByVerifiedEmail(ctx: QueryCtx, email: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .filter((q) => q.neq(q.field("emailVerificationTime"), undefined))
    .first()
  return user?._id ?? null
}
