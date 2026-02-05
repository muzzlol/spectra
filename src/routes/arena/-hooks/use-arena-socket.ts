import { useCallback, useState } from "react"
import useWebSocket, { type ReadyState } from "react-use-websocket"
import type { ArenaType } from "~/convex/schema/arena.ts"
import type {
  ArenaConfig,
  ArenaData,
  ArenaEndReason,
  ArenaEvent,
  ArenaResults,
  ClientAction,
  ClientMsg,
  Participant,
  ServerMsg
} from "~/shared/arena-protocol"

type useArenaSocketOptions<T extends ArenaType> = {
  arenaId: string
  userId: string
  username: string
  config: ArenaConfig<T>
  onGameOver?: (reason: ArenaEndReason, results: ArenaResults) => void
  onArenaEvent: (event: ArenaEvent<T>) => void
}

type useArenaSocketReturn<T extends ArenaType> = ArenaClientState<T> & {
  connectionState: ReadyState
  sendAction: (action: ClientAction<T>) => void
}

type ArenaClientState<T extends ArenaType> = {
  participants: Participant[]
  data: ArenaData<T> | null
  timeRemaining: number
  error: string | null
}

export function useArenaSocket<T extends ArenaType>({
  arenaId,
  userId,
  username,
  config,
  onGameOver,
  onArenaEvent
}: useArenaSocketOptions<T>): useArenaSocketReturn<T> {
  const [state, setState] = useState<ArenaClientState<T>>({
    participants: [],
    data: null,
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
      return code !== 1000 && code !== 1002
    },
    onOpen: () => {
      console.log("ArenaWS opened")
      sendJsonMessage({
        type: "init",
        userId,
        username,
        config
      } satisfies ClientMsg<T>)
    },
    onClose: () => {
      console.log("ArenaWS closed")
    },
    onMessage: (event) => {
      const message = JSON.parse(event.data) as ServerMsg<T>

      switch (message.type) {
        case "mechanic":
          onArenaEvent(message.event)
          break

        case "state":
          setState((prev) => ({
            ...prev,
            participants: message.participants,
            data: message.data,
            timeRemaining: message.timeRemaining
          }))
          break

        case "participant_joined": {
          setState((prev) => ({
            ...prev,
            participants: [...prev.participants, message.participant]
          }))
          break
        }

        case "participant_left":
          setState((prev) => ({
            ...prev,
            participants: prev.participants.filter(
              (p) => p.id !== message.participantId
            )
          }))
          break

        case "tick":
          setState((prev) => ({
            ...prev,
            timeRemaining: message.timeRemaining
          }))
          break

        case "arena_over":
          onGameOver?.(message.reason, message.results)
          break

        case "error":
          setState((prev) => ({ ...prev, error: message.message }))
          break

        default: {
          const _exhaustive: never = message
          throw new Error(`Unknown message type: ${_exhaustive}`)
        }
      }
    }
  })

  const sendAction = useCallback(
    (action: ClientAction<T>) => {
      sendJsonMessage(action)
    },
    [sendJsonMessage]
  )

  return {
    ...state,
    connectionState: readyState,
    sendAction
  }
}
