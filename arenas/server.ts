import { DurableObject } from "cloudflare:workers"
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types"
import type { ArenaType } from "~/convex/schema/arena.ts"
import type {
  ArenaConfig,
  ArenaData,
  ArenaEndReason,
  ArenaResults,
  ClientAction,
  ClientMsg,
  CodeData,
  DrawData,
  Participant,
  ServerMsg,
  SessionAttachment
} from "~/shared/arena-protocol"
import logger from "~/shared/logger"
import type { WorkerEnv } from "./env.d.ts"

type ArenaState<T extends ArenaType = ArenaType> = {
  config: ArenaConfig | null
  startedAt: number | null
  data: ArenaData<T> | null
}

export function createEmptyData<T extends ArenaType>(
  arenaType: T
): ArenaData<T> {
  switch (arenaType) {
    case "draw":
      return { playerElements: {}, playerCursors: {} } as ArenaData<T>
    case "code":
      return {
        language: "python",
        playerCode: {},
        testResults: {},
        playerCursors: {}
      } as ArenaData<T>
    case "typing":
      return { progress: {} } as ArenaData<T>
    default:
      throw new Error(`Unknown arena type: ${arenaType}`)
  }
}

export default {
  fetch: async (req: Request, env: WorkerEnv) => {
    const url = new URL(req.url)
    const arenaId = url.searchParams.get("arenaId")
    logger.info({ message: "fetch", url: req.url, arenaId })

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

    // Validate arena exists and is joinable before upgrading
    const validationRes = await fetch(
      `${env.CONVEX_SITE_URL}/api/arenas/status?arenaId=${arenaId}`
    ).catch(() => null)

    if (!validationRes?.ok) {
      logger.warn({ message: "Failed to validate arena", arenaId })
      // Proceed anyway - let DO handle it if Convex is unreachable
    } else {
      const { exists, status } = (await validationRes.json()) as {
        exists: boolean
        status: "lobby" | "active" | "ended" | null
      }
      if (!exists) {
        return new Response(JSON.stringify({ error: "Arena not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        })
      }
      if (status === "ended") {
        return new Response(JSON.stringify({ error: "Arena has ended" }), {
          status: 410,
          headers: { "Content-Type": "application/json" }
        })
      }
    }

    const namespace = env.ARENAS as DurableObjectNamespace<ArenaWSS>
    const stub = namespace.get(namespace.idFromName(arenaId))

    return stub.fetch(req)
  }
}

export class ArenaWSS extends DurableObject<WorkerEnv> {
  #state: ArenaState = {
    config: null,
    startedAt: null,
    data: null
  }

  constructor(ctx: DurableObjectState, env: WorkerEnv) {
    super(ctx, env)
    // restore state from hibernation
    ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get<ArenaState>("state")
      if (stored) {
        this.#state = {
          config: stored.config,
          startedAt: stored.startedAt,
          data: stored.data
        }
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
    logger.info({ message: "WebSocket upgrade accepted" })

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, raw: string) {
    let msg: ClientMsg<ArenaType>
    try {
      msg = JSON.parse(raw)
    } catch {
      return this.send(ws, { type: "error", message: "Invalid message format" })
    }

    if (msg.type === "leave") {
      return ws.close(1000, "Player left")
    }
    if (msg.type === "init") {
      return this.handleInit(ws, msg)
    }
    if (!this.#state.config) {
      return this.send(ws, { type: "error", message: "Arena not initialized" })
    }

    const arenaType = this.#state.config.type

    const action = msg as ClientAction<ArenaType>
    switch (arenaType) {
      case "draw":
        await this.handleDraw(ws, action as ClientAction<"draw">)
        break
      case "code":
        // await this.handleCode(ws, action as ClientAction<"code">)
        break
      case "typing":
        // await this.handleTyping(ws, action as ClientAction<"typing">)
        break
    }
  }

  async webSocketClose(ws: WebSocket, _code: number, _reason: string) {
    const attachment = this.getAttachment(ws)
    if (attachment) {
      logger.info({
        message: "Player left",
        arenaId: this.#state.config?.arenaId,
        userId: attachment.participantId,
        username: attachment.username,
        code: _code,
        reason: _reason
      })
      this.removePlayerData(attachment.participantId)
      this.broadcast(
        { type: "participant_left", participantId: attachment.participantId },
        ws
      )
    }

    if (attachment?.participantId === this.#state.config?.hostId) {
      await this.finalize("host_left")
      return
    }

    const remaining = this.ctx.getWebSockets()
    if (remaining.length === 0) {
      await this.finalize("abandoned")
    }
  }

  webSocketError(_ws: WebSocket, error: unknown) {
    console.error("WebSocket error:", error)
  }

  async alarm() {
    const timeRemaining = this.getTimeRemaining()

    if (timeRemaining <= 0) {
      await this.finalize("completed")
      return
    }

    // broadcast tick to all connected clients
    this.broadcast({ type: "tick", timeRemaining })

    // schedule next tick (1 second)
    await this.ctx.storage.setAlarm(Date.now() + 1000)
  }

  // --- Handlers ---

  private async handleInit(
    ws: WebSocket,
    msg: Extract<ClientMsg<ArenaType>, { type: "init" }>
  ) {
    const { userId, username, config } = msg

    logger.info({
      message: "Player joined",
      arenaId: config?.arenaId ?? this.#state.config?.arenaId,
      userId,
      username,
      activeConnections: this.ctx.getWebSockets().length
    })

    if (!this.#state.config) {
      if (!config) {
        this.send(ws, { type: "error", message: "Arena not initialized" })
        ws.close(1002, "Initialization required")
        return
      }
      logger.info({ message: "Initializing arena", config })

      this.#state.config = config
      this.#state.startedAt = Date.now()
      this.#state.data = createEmptyData(config.type)

      await this.ctx.storage.put("state", this.#state)
      // start tick loop (broadcasts time every second)
      await this.ctx.storage.setAlarm(Date.now() + 1000)
    }

    // store user session data for this connection
    const attachment: SessionAttachment = {
      participantId: userId,
      username,
      joinedAt: Date.now()
    }
    ws.serializeAttachment(attachment)

    // send current state
    const participants = this.getParticipants()
    const timeRemaining = this.getTimeRemaining()

    const state: Extract<ServerMsg<ArenaType>, { type: "state" }> = {
      type: "state",
      arenaState: this.#state.data,
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

  private async handleDraw(ws: WebSocket, msg: ClientAction<"draw">) {
    const attachment = this.getAttachment(ws)
    if (!attachment) return

    const data = this.#state.data as DrawData
    switch (msg.type) {
      case "cursor":
        return this.handleCursorUpdate(ws, data, attachment, msg.x, msg.y)
      case "canvas_update":
        return this.handleCanvasUpdate(ws, data, attachment, msg.elements)
    }
  }

  private async handleCursorUpdate(
    ws: WebSocket,
    data: DrawData,
    attachment: SessionAttachment,
    x: number,
    y: number
  ) {
    data.playerCursors[attachment.participantId] = { x, y }
    this.ctx.storage.put("state", this.#state)
    this.broadcast(
      { type: "cursor", participantId: attachment.participantId, x, y },
      ws
    )
  }

  private async handleCanvasUpdate(
    ws: WebSocket,
    data: DrawData,
    attachment: SessionAttachment,
    elements: ExcalidrawElement[]
  ) {
    data.playerElements[attachment.participantId] = elements
    this.ctx.storage.put("state", this.#state)
    this.broadcast(
      {
        type: "canvas_update",
        elements: elements,
        participantId: attachment.participantId
      },
      ws
    )
  }

  private async finalize(reason: ArenaEndReason) {
    const config = this.#state.config
    if (!config) {
      logger.warn({ message: "Finalize called but no config found", reason })
      return
    }

    const participants = this.getParticipants()
    logger.info({
      message: "Finalizing arena",
      arenaId: config.arenaId,
      reason,
      participantCount: participants.length
    })

    const duration = this.#state.startedAt
      ? Math.floor((Date.now() - this.#state.startedAt) / 1000)
      : 0

    const results: ArenaResults = {
      arenaId: config.arenaId,
      endReason: reason,
      duration,
      participants,
      finalData: this.#state.data ?? undefined
    }

    await this.saveToConvex(results)

    this.broadcast({ type: "arena_over", reason, results })

    for (const socket of this.ctx.getWebSockets()) {
      socket.close(1000, `Game ended: ${reason}`)
    }
    // rm alarm first cause storage prob has metadata about it
    await this.ctx.storage.deleteAlarm()
    await this.ctx.storage.deleteAll()
  }

  private async saveToConvex(results: ArenaResults) {
    const siteUrl = this.env.CONVEX_SITE_URL
    const serviceSecret = this.env.CONVEX_SERVICE_SECRET

    if (!siteUrl || !serviceSecret) {
      logger.error({ message: "Convex configuration missing (URL or Secret)" })
      return
    }

    const response = await fetch(`${siteUrl}/api/arenas/finalize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceSecret}`
      },
      body: JSON.stringify(results)
    }).catch((error) => {
      logger.error({
        message: "Network error saving to Convex",
        error: error instanceof Error ? error.message : String(error),
        arenaId: results.arenaId
      })
      return null
    })

    if (!response) return

    if (!response.ok) {
      const errorText = await response.text()
      logger.error({
        message: "Failed to save results to Convex",
        status: response.status,
        error: errorText,
        arenaId: results.arenaId
      })
      return
    }

    logger.info({
      message: "Results saved to Convex successfully",
      arenaId: results.arenaId
    })
  }

  // --- Helpers ---

  private getAttachment(ws: WebSocket): SessionAttachment | null {
    return ws.deserializeAttachment() as SessionAttachment | null
  }

  private removePlayerData(participantId: string) {
    const data = this.#state.data
    if (!data) return
    const arenaType = this.#state.config?.type
    switch (arenaType) {
      case "draw": {
        const drawData = data as DrawData
        delete drawData.playerCursors[participantId]
        break
      }
      case "code": {
        const codeData = data as CodeData
        delete codeData.testResults[participantId]
        delete codeData.playerCursors[participantId]
        break
      }
      case "typing": {
        break
      }
    }
    this.ctx.storage.put("state", this.#state)
  }

  private getTimeRemaining(): number {
    if (!this.#state.config || !this.#state.startedAt) return 0
    const elapsed = (Date.now() - this.#state.startedAt) / 1000
    return Math.max(0, this.#state.config.timeLimit - elapsed)
  }

  private getParticipants(): Participant[] {
    return this.ctx
      .getWebSockets()
      .map((socket) => this.getAttachment(socket))
      .filter((a): a is SessionAttachment => a !== null)
      .map((a) => ({
        id: a.participantId,
        username: a.username,
        joinedAt: a.joinedAt
      }))
  }

  private send(ws: WebSocket, msg: ServerMsg<ArenaType>) {
    ws.send(JSON.stringify(msg))
  }

  private broadcast(msg: ServerMsg<ArenaType>, exclude?: WebSocket) {
    const data = JSON.stringify(msg)

    for (const socket of this.ctx.getWebSockets()) {
      if (socket !== exclude) {
        socket.send(data)
      }
    }
  }
}
