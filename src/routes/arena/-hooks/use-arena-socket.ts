import { useCallback, useState } from "react"
import useWebSocket from "react-use-websocket"
import type {
  ArenaConfig,
  ClientMsg,
  Participant,
  ServerMsg
} from "~/shared/arena-protocol"

/** Type-agnostic cursor data - pane components interpret based on arena type */
export type CursorData = {
  participantId: string
  x: number
  y: number
  timestamp: number
}

type ArenaSocketState = {
  participants: Participant[]
  elements: unknown[]
  cursors: Map<string, CursorData>
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
  const [state, setState] = useState<ArenaSocketState>({
    participants: [],
    elements: [],
    cursors: new Map(),
    timeRemaining: config.timeLimit,
    error: null
  })

  const getWsUrl = useCallback(() => {
    const host = import.meta.env.VITE_ARENA_HOST
    if (!host) {
      throw new Error("VITE_ARENA_HOST is not configured")
    }
    const wsHost = host.replace(/^http/, "ws")
    return `${wsHost}?arenaId=${arenaId}`
  }, [arenaId])

  const { sendJsonMessage, readyState } = useWebSocket(getWsUrl(), {
    share: false,
    shouldReconnect: (closeEvent) => {
      const code = closeEvent.code
      if (code === 1000 || code === 1002) {
        return false
      }
      return true
    },
    onOpen: () => {
      console.log("ArenaWS opened")
      sendJsonMessage({
        type: "init",
        userId,
        username,
        config
      } satisfies ClientMsg)
    },
    onClose: () => {
      console.log("ArenaWS closed")
    },
    onMessage: (event) => {
      const message = JSON.parse(event.data) as ServerMsg

      switch (message.type) {
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

        case "participant_left": {
          setState((prev) => {
            const newCursors = new Map(prev.cursors)
            newCursors.delete(message.participantId)
            return {
              ...prev,
              participants: prev.participants.filter(
                (p) => p.id !== message.participantId
              ),
              cursors: newCursors
            }
          })
          break
        }

        case "element_change":
          setState((prev) => ({
            ...prev,
            elements: message.elements
          }))
          break

        case "cursor": {
          const cursorData: CursorData = {
            participantId: message.participantId,
            x: message.x,
            y: message.y,
            timestamp: Date.now()
          }
          setState((prev) => {
            const newCursors = new Map(prev.cursors)
            newCursors.set(message.participantId, cursorData)
            return { ...prev, cursors: newCursors }
          })
          break
        }

        case "tick":
          setState((prev) => ({
            ...prev,
            timeRemaining: message.timeRemaining
          }))
          break

        case "game_over":
          onGameOver?.(message.reason)
          break

        case "error":
          setState((prev) => ({ ...prev, error: message.message }))
          break
      }
    }
  })

  const sendElements = useCallback(
    (elements: unknown[]) => {
      sendJsonMessage({ type: "element_change", elements } satisfies ClientMsg)
    },
    [sendJsonMessage]
  )

  const sendCursor = useCallback(
    (x: number, y: number) => {
      sendJsonMessage({ type: "cursor", x, y } satisfies ClientMsg)
    },
    [sendJsonMessage]
  )

  return {
    ...state,
    connectionState: readyState,
    sendElements,
    sendCursor
  }
}
