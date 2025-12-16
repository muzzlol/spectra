import { useCallback, useEffect, useRef, useState } from "react"
import type {
  ArenaConfig,
  ClientMsg,
  Participant,
  ServerMsg
} from "~/shared/arena-protocol"

type ConnectionState = "connecting" | "connected" | "disconnected" | "error"

type ArenaSocketState = {
  connectionState: ConnectionState
  participants: Participant[]
  elements: unknown[]
  timeRemaining: number
  error: string | null
}

type UseArenaSocketOptions = {
  arenaId: string
  userId: string
  username: string
  config: ArenaConfig
  onGameOver?: (reason: string) => void
}

export function useArenaSocket({
  arenaId,
  userId,
  username,
  config,
  onGameOver
}: UseArenaSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const [state, setState] = useState<ArenaSocketState>({
    connectionState: "disconnected",
    participants: [],
    elements: [],
    timeRemaining: config.timeLimit,
    error: null
  })

  const getWsUrl = useCallback(() => {
    const host = import.meta.env.VITE_ARENA_HOST
    const wsHost = host.replace(/^http/, "ws")
    return `${wsHost}?arenaId=${arenaId}`
  }, [arenaId])

  const send = useCallback((message: ClientMsg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const message = JSON.parse(event.data) as ServerMsg

      switch (message.type) {
        case "connected":
          setState((prev) => ({ ...prev, connectionState: "connected" }))
          break

        case "state":
          setState((prev) => ({
            ...prev,
            participants: message.participants,
            elements: message.elements,
            timeRemaining: message.timeRemaining
          }))
          break

        case "participant_joined":
          setState((prev) => ({
            ...prev,
            participants: [...prev.participants, message.participant]
          }))
          break

        case "participant_left":
          setState((prev) => ({
            ...prev,
            participants: prev.participants.filter(
              (p) => p.id !== message.participantId
            )
          }))
          break

        case "element_change":
          setState((prev) => ({
            ...prev,
            elements: message.elements
          }))
          break

        case "game_over":
          onGameOver?.(message.reason)
          break

        case "error":
          setState((prev) => ({ ...prev, error: message.message }))
          break
      }
    },
    [onGameOver]
  )

  const connect = useCallback(() => {
    if (!userId) return

    const state = wsRef.current?.readyState
    if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return

    setState((prev) => ({
      ...prev,
      connectionState: "connecting",
      error: null
    }))

    const ws = new WebSocket(getWsUrl())
    wsRef.current = ws

    ws.onopen = () => {
      send({ type: "init", userId, username, config })
    }

    ws.onmessage = handleMessage

    ws.onerror = () => {
      setState((prev) => ({
        ...prev,
        connectionState: "error",
        error: "WebSocket connection error"
      }))
    }

    ws.onclose = () => {
      setState((prev) => ({ ...prev, connectionState: "disconnected" }))
      wsRef.current = null
    }
  }, [getWsUrl, handleMessage, send, userId, username, config])

  const disconnect = useCallback(() => {
    const ws = wsRef.current
    if (!ws) return

    if (ws.readyState === WebSocket.OPEN) {
      wsRef.current = null
      send({ type: "leave" })
      ws.close()
    }
  }, [send])

  const sendElements = useCallback(
    (elements: unknown[]) => {
      send({ type: "element_change", elements })
    },
    [send]
  )

  const sendCursor = useCallback(
    (x: number, y: number) => {
      send({ type: "cursor", x, y })
    },
    [send]
  )

  const connectRef = useRef(connect)
  const disconnectRef = useRef(disconnect)
  connectRef.current = connect
  disconnectRef.current = disconnect

  useEffect(() => {
    connectRef.current()
    return () => disconnectRef.current()
  }, [])

  return {
    ...state,
    connect,
    disconnect,
    sendElements,
    sendCursor
  }
}
