import GitHub from "@auth/core/providers/github"
// import Google from "@auth/core/providers/google"
import Resend from "@auth/core/providers/resend"
import { Anonymous } from "@convex-dev/auth/providers/Anonymous"
import { convexAuth } from "@convex-dev/auth/server"
import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { action } from "./_generated/server"
import { getEnv } from "./env"
import { getUserByVerifiedEmail } from "./users"

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub({
      clientId: getEnv("AUTH_GITHUB_ID"),
      clientSecret: getEnv("AUTH_GITHUB_SECRET"),
      profile(githubProfile) {
        return {
          username: githubProfile.login,
          isAnonymous: false,
          email: githubProfile.email,
          picture: githubProfile.avatar_url
        }
      }
    }),
    Resend({
      apiKey: getEnv("AUTH_RESEND_KEY"),
      from: getEnv("AUTH_EMAIL") ?? "Spectra <noreply@auth.muzzkhan.dev>"
    }),
    // Google({
    //   clientId: getEnv("AUTH_GOOGLE_ID"),
    //   clientSecret: getEnv("AUTH_GOOGLE_SECRET"),
    //   profile(googleProfile) {
    //     return {
    //       username: googleProfile.name,
    //       isAnonymous: false,
    //       email: googleProfile.email,
    //       picture: googleProfile.picture
    //     }
    //   }
    // }),
    Anonymous({
      id: "anon",
      profile: (params) => {
        return {
          username: params.username ?? "Anon",
          isAnonymous: true
        }
      }
    })
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      const { existingUserId, provider, profile } = args
      // auth account already exists with provider
      if (existingUserId) {
        return existingUserId as Id<"users">
      }
      // anonymous user creation
      if (provider.id === "anon") {
        const userId = await ctx.db.insert("users", {
          username: (profile.username as string | undefined) ?? "Anon",
          isAnonymous: true
        })
        return userId
      }

      //   OAuth/Magic Link

      const email = profile.email as string | undefined

      //  check if current session is anonymous
      const identity = await ctx.auth.getUserIdentity()
      const currentUserId = identity?.subject.split("|")[0] as
        | Id<"users">
        | undefined
      const currentUser = currentUserId ? await ctx.db.get(currentUserId) : null

      if (currentUser?.isAnonymous && currentUserId) {
        await ctx.db.patch(currentUserId, {
          isAnonymous: false,
          email: email,
          username:
            currentUser.username ?? (profile.username as string | undefined),
          picture:
            currentUser.picture ?? (profile.picture as string | undefined),
          emailVerificationTime: email ? Date.now() : undefined
        })
        return currentUserId
      }

      // check for existing user with verified email to link
      if (email) {
        const existingUserId = await getUserByVerifiedEmail(ctx, email)
        if (existingUserId) {
          return existingUserId
        }
      }

      // new user creation
      return await ctx.db.insert("users", {
        username: profile.username as string | undefined,
        isAnonymous: false,
        email: email,
        picture: profile.picture as string | undefined,
        emailVerificationTime: email ? Date.now() : undefined
      })
    }
  }
})

// for ip on client const ip(using cf workers whci we are) =
//   request.headers.get("CF-Connecting-IP") ||
//   request.headers.get("X-Forwarded-For") ||
//   "unknown";
export const validateCaptcha = action({
  args: { token: v.string(), remoteIp: v.string() },
  handler: async (_, { token, remoteIp }) => {
    const formData = new FormData()
    const secret = getEnv("CF_TURNSTILE_SECRET")
    formData.append("secret", secret)
    formData.append("response", token)
    formData.append("remoteip", remoteIp)

    try {
      const response = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          body: formData,
          method: "POST"
        }
      )
      const { success } = await response.json()
      return success
    } catch (error) {
      console.error(error)
      return false
    }
  }
})
