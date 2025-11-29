import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, v } from "convex/values"
import { usernameSchema } from "~/shared/validators/username"
import type { QueryCtx } from "./_generated/server"
import { mutation, query } from "./_generated/server"

export const getCurrentUser = query({
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      username: v.optional(v.string()),
      isAnonymous: v.boolean(),
      email: v.optional(v.string()),
      picture: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      stats: v.optional(
        v.object({
          draw: v.object({ wins: v.number(), played: v.number() }),
          code: v.object({ wins: v.number(), played: v.number() }),
          typing: v.object({ wins: v.number(), played: v.number() })
        })
      )
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
      emailVerificationTime: user.emailVerificationTime,
      stats: user.stats
    }
  }
})

export const setUsername = mutation({
  args: { username: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const parsed = usernameSchema.safeParse(args)
    if (!parsed.success) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0].message
      })
    }
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated"
      })
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first()
    if (existing) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Username already exists"
      })
    }

    await ctx.db.patch(userId, { username: args.username })
    return null
  }
})

export const isUsernameAvailable = query({
  args: { username: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const parsed = usernameSchema.safeParse(args)
    if (!parsed.success) {
      return false
    }
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
