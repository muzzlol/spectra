import { httpRouter } from "convex/server"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { httpAction } from "./_generated/server"
import { auth } from "./auth"

const http = httpRouter()

auth.addHttpRoutes(http)

http.route({
  path: "/api/arenas/finalize",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json()

    const { arenaId, endReason, duration, participants, finalElements } =
      body as {
        arenaId: Id<"arenas">
        endReason: "completed" | "abandoned" | "host_ended"
        duration: number
        participants: Array<{ id: string; username: string; score?: number }>
        finalElements?: unknown[]
      }

    if (!arenaId) {
      return new Response(JSON.stringify({ error: "arenaId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    await ctx.runMutation(internal.arenas.finalizeFromDO, {
      arenaId,
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
