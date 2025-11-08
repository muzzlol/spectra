import Resend from "@auth/core/providers/resend"
import { Anonymous } from "@convex-dev/auth/providers/Anonymous"
import { convexAuth } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { action } from "./_generated/server"

// for ip on client const ip(using cf workers whci we are) =
//   request.headers.get("CF-Connecting-IP") ||
//   request.headers.get("X-Forwarded-For") ||
//   "unknown";
export const validateCaptcha = action({
  args: { token: v.string(), remoteIp: v.string() },
  handler: async (_, { token, remoteIp }) => {
    const formData = new FormData()
    const secret = process.env.CF_TURNSTILE_SECRET
    if (!secret) throw new Error("CF_TURNSTILE_SECRET is not set")
    formData.append("secret", secret)
    formData.append("response", token)
    formData.append("remoteip", remoteIp)

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        body: formData,
        method: "POST"
      }
    )
    const { success } = await response.json()
    return success
  }
})

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: process.env.AUTH_EMAIL ?? "Spectra <noreply@auth.muzzkhan.dev>"
    }),
    Anonymous()
  ]
})
