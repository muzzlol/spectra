import { httpRouter } from "convex/server"
import type { GameResults } from "~/shared/arena-protocol"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { httpAction } from "./_generated/server"
import { auth } from "./auth"
import { getEnv } from "./env"

const http = httpRouter()

auth.addHttpRoutes(http)

http.route({
  path: "/api/arenas/status",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url)
    const arenaId = url.searchParams.get("arenaId")

    if (!arenaId) {
      return new Response(JSON.stringify({ error: "arenaId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    try {
      const arena = await ctx.runQuery(internal.arenas.getStatus, {
        arenaId: arenaId as Id<"arenas">
      })
      return new Response(JSON.stringify(arena), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    } catch {
      return new Response(JSON.stringify({ exists: false, status: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    }
  })
})

http.route({
  path: "/api/arenas/finalize",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const serviceSecret = getEnv("CONVEX_SERVICE_SECRET")
    const authHeader = req.headers.get("Authorization")

    if (!serviceSecret) {
      console.error("CONVEX_SERVICE_SECRET not configured")
      return new Response(JSON.stringify({ error: "Service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      })
    }

    if (!authHeader || authHeader !== `Bearer ${serviceSecret}`) {
      console.warn("Unauthorized access attempt to /api/arenas/finalize")
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    const body = await req.json()

    const { arenaId, endReason, duration, participants, finalElements } =
      body as GameResults

    if (!arenaId) {
      return new Response(JSON.stringify({ error: "arenaId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    await ctx.runMutation(internal.arenas.finalizeFromDO, {
      arenaId: arenaId as Id<"arenas">,
      endReason,
      duration,
      participants,
      finalElements
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  })
})

export default http
