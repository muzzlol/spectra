import { DurableObject } from "cloudflare:workers"
import type {
  ArenaConfig,
  ClientMsg,
  GameEndReason,
  GameResults,
  Participant,
  ServerMsg,
  SessionAttachment
} from "~/shared/arena-protocol"
import type { WorkerEnv } from "./env.d.ts"

export default {
  fetch: (req: Request, env: WorkerEnv) => {
    const url = new URL(req.url)
    const arenaId = url.searchParams.get("arenaId")

    if (!arenaId) {
      return new Response(JSON.stringify({ error: "arenaId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const upgrade = req.headers.get("Upgrade")
    if (upgrade !== "websocket") {
      return new Response("Expected WebSocket upgrade", { status: 426 })
    }

    const stub = env.ARENAS.get(env.ARENAS.idFromName(arenaId))
    return stub.fetch(req)
  }
}

export class ArenaWSS extends DurableObject<WorkerEnv> {
  #state: ArenaState = {
    config: null,
    startedAt: null,
    elements: []
  }

  constructor(ctx: DurableObjectState, env: WorkerEnv) {
    super(ctx, env)
    // restore state from hibernation
    ctx.blockConcurrencyWhile(async () => {
      const stored = (await ctx.storage.get<ArenaState>("state")) ?? {
        config: null,
        startedAt: null,
        elements: []
      }
      this.#state = {
        config: stored.config ?? null,
        startedAt: stored.startedAt ?? null,
        elements: stored.elements ?? []
      }
    })
  }

  async fetch(req: Request): Promise<Response> {
    const upgrade = req.headers.get("Upgrade")
    if (upgrade !== "websocket") {
      return new Response("Expected WebSocket upgrade", {
        status: 426
      })
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    this.ctx.acceptWebSocket(server)

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    if (typeof raw !== "string") {
      this.send(ws, { type: "error", message: "Binary messages not supported" })
      return
    }
    const msg = this.parseMsg(raw)
    if (!msg) {
      this.send(ws, { type: "error", message: "Invalid message format" })
      return
    }

    switch (msg.type) {
      case "init":
        await this.handleInit(ws, msg)
        break
      case "cursor":
        await this.handleCursor(ws, msg.x, msg.y)
        break
      case "element_change":
        await this.handleElementChange(ws, msg.elements)
        break
      case "leave":
        ws.close(1000, "Player left")
        break
    }
  }

  async webSocketClose(ws: WebSocket, _code: number, _reason: string) {
    const attachment = this.getAttachment(ws)
    if (attachment) {
      this.broadcast(
        { type: "participant_left", participantId: attachment.participantId },
        ws
      )
    }

    if (attachment?.participantId === this.#state.config?.hostId) {
      await this.finalize("host_left")
    }

    const remaining = this.ctx.getWebSockets()
    if (remaining.length === 0) {
      await this.ctx.storage.deleteAlarm()
      await this.finalize("abandoned")
    }
  }

  webSocketError(_ws: WebSocket, error: unknown) {
    console.error("WebSocket error:", error)
  }

  async alarm() {
    await this.finalize("completed")
  }

  // --- Handlers ---

  private async handleInit(
    ws: WebSocket,
    msg: Extract<ClientMsg, { type: "init" }>
  ) {
    const { userId, username, config } = msg

    if (!config) {
      this.send(ws, { type: "error", message: "Missing arena configuration" })
      ws.close(1002, "Missing arena configuration")
      return
    }
    const isFirstPlayer = this.ctx.getWebSockets().length === 1

    // Initialize game state on first connection
    if (isFirstPlayer && !this.#state.config) {
      this.#state.startedAt = Date.now()
      this.#state.elements = []
      this.#state.config = { ...config, hostId: userId }

      this.ctx.storage.put("state", this.#state)

      const endTime = Date.now() + config.timeLimit * 1000
      await this.ctx.storage.setAlarm(endTime)
    }

    // store user session data for this connection
    const attachment: SessionAttachment = {
      participantId: userId,
      username,
      joinedAt: Date.now()
    }
    ws.serializeAttachment(attachment)

    this.send(ws, { type: "connected", participantId: userId })

    // send current state
    const participants = this.getParticipants()
    const timeRemaining = this.getTimeRemaining()

    const state: Extract<ServerMsg, { type: "state" }> = {
      type: "state",
      elements: this.#state.elements,
      participants,
      timeRemaining
    }

    this.send(ws, state)

    this.broadcast(
      {
        type: "participant_joined",
        participant: { id: userId, username, joinedAt: attachment.joinedAt }
      },
      ws
    )
  }

  private async handleCursor(ws: WebSocket, x: number, y: number) {
    const attachment = this.getAttachment(ws)
    if (!attachment) return

    this.broadcast(
      {
        type: "cursor",
        participantId: attachment.participantId,
        x,
        y
      },
      ws
    )
  }

  private async handleElementChange(ws: WebSocket, elements: unknown[]) {
    const attachment = this.getAttachment(ws)
    if (!attachment) return

    this.#state.elements = elements
    this.ctx.storage.put("state", this.#state)

    this.broadcast(
      {
        type: "element_change",
        elements,
        from: attachment.participantId
      },
      ws
    )
  }

  private async finalize(reason: GameEndReason) {
    const config = this.#state.config
    if (!config) return

    const participants = this.getParticipants()
    const duration = this.#state.startedAt
      ? Math.floor((Date.now() - this.#state.startedAt) / 1000)
      : 0

    const results: GameResults = {
      arenaId: config.arenaId,
      endReason: reason,
      duration,
      participants,
      finalElements: this.#state.elements
    }

    this.broadcast({ type: "game_over", reason, results })

    for (const socket of this.ctx.getWebSockets()) {
      socket.close(1000, `Game ended: ${reason}`)
    }

    await this.saveToConvex(results)

    await this.ctx.storage.deleteAll()
  }

  private async saveToConvex(results: GameResults) {
    const siteUrl = this.env.CONVEX_SITE_URL
    if (!siteUrl) {
      console.error("CONVEX_SITE_URL not configured")
      return
    }

    try {
      const serviceSecret = this.env.CONVEX_SERVICE_SECRET
      if (!serviceSecret) {
        console.error("CONVEX_SERVICE_SECRET not configured")
        return
      }

      const response = await fetch(`${siteUrl}/api/arenas/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceSecret}`
        },
        body: JSON.stringify(results)
      })

      if (!response.ok) {
        console.error(
          "Failed to save results to Convex:",
          await response.text()
        )
      }
    } catch (error) {
      console.error("Error saving to Convex:", error)
    }
  }

  // --- Helpers ---

  private getAttachment(ws: WebSocket): SessionAttachment | null {
    return ws.deserializeAttachment() as SessionAttachment | null
  }

  private getTimeRemaining(): number {
    if (!this.#state.config || !this.#state.startedAt) return 0
    const elapsed = (Date.now() - this.#state.startedAt) / 1000
    return Math.max(0, this.#state.config.timeLimit - elapsed)
  }

  private getParticipants(): Participant[] {
    const participants = this.ctx
      .getWebSockets()
      .map((socket) => this.getAttachment(socket))
      .filter(
        (attachment): attachment is SessionAttachment => attachment !== null
      )
      .map((attachment) => ({
        id: attachment.participantId,
        username: attachment.username,
        joinedAt: attachment.joinedAt
      }))
    return participants
  }

  private send(ws: WebSocket, msg: ServerMsg) {
    ws.send(JSON.stringify(msg))
  }

  private broadcast(msg: ServerMsg, exclude?: WebSocket) {
    const data = JSON.stringify(msg)

    for (const socket of this.ctx.getWebSockets()) {
      if (socket !== exclude) {
        socket.send(data)
      }
    }
  }

  private parseMsg(raw: string): ClientMsg | null {
    try {
      return JSON.parse(raw) as ClientMsg
    } catch {
      return null
    }
  }
}

type ArenaState = {
  config: ArenaConfig | null
  startedAt: number | null
  elements: unknown[]
}
