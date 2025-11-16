import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import type { QueryCtx } from "./_generated/server"
import { mutation, query } from "./_generated/server"

export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      username: v.optional(v.string()),
      isAnonymous: v.boolean(),
      email: v.optional(v.string()),
      picture: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number())
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return null
    }
    const user = await ctx.db.get(userId)
    if (!user) {
      return null
    }
    return {
      _id: user._id,
      username: user.username,
      isAnonymous: user.isAnonymous,
      email: user.email,
      picture: user.picture,
      emailVerificationTime: user.emailVerificationTime
    }
  }
})

export const setUsername = mutation({
  args: { username: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Not authenticated")
    }

    await ctx.db.patch(userId, { username: args.username })
    return null
  }
})

export const isUsernameAvailable = query({
  args: { username: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
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
