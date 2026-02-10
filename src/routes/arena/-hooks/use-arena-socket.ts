import { useCallback, useMemo, useState } from "react"
import useWebSocket, { type ReadyState } from "react-use-websocket"
import type { ArenaType } from "~/convex/schema/arena"
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

type UseArenaSocketOptions<T extends ArenaType> = {
  arenaId: string
  userId: string
  username: string
  config: ArenaConfig<T>
  enabled?: boolean
  onGameOver?: (reason: ArenaEndReason, results: ArenaResults) => void
  onArenaEvent: (event: ArenaEvent<T>) => void
}

type UseArenaSocketReturn<T extends ArenaType> = ArenaClientState<T> & {
  connectionState: ReadyState
  sendAction: (action: ClientAction<T>) => void
  leave: () => void
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
  enabled = true,
  onGameOver,
  onArenaEvent
}: UseArenaSocketOptions<T>): UseArenaSocketReturn<T> {
  const [state, setState] = useState<ArenaClientState<T>>(() => ({
    participants: [],
    data: null,
    timeRemaining: config.timeLimit,
    error: null
  }))

  const socketUrl = useMemo(() => {
    if (!enabled) return null

    const host = import.meta.env.VITE_ARENA_HOST
    if (!host) return null

    const wsHost = host.replace(/^http/, "ws")
    return `${wsHost}?arenaId=${arenaId}`
  }, [arenaId, enabled])

  const { sendJsonMessage, readyState } = useWebSocket<ServerMsg<T>>(
    socketUrl,
    {
      share: false,
      shouldReconnect: (closeEvent) => {
        if (!enabled) return false
        const code = closeEvent.code
        return code !== 1000 && code !== 1002
      },
      onOpen: () => {
        console.log("ArenaWS opened")
        setState((prev) => ({ ...prev, error: null }))
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
        let message: ServerMsg<T>
        try {
          message = JSON.parse(event.data) as ServerMsg<T>
        } catch {
          setState((prev) => ({
            ...prev,
            error: "Received invalid message from arena server"
          }))
          return
        }

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
                (participant) => participant.id !== message.participantId
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
            console.error(`Unknown message type: ${_exhaustive}`)
          }
        }
      }
    },
    enabled
  )

  const sendAction = useCallback(
    (action: ClientAction<T>) => {
      if (!enabled || !socketUrl) return
      sendJsonMessage(action)
    },
    [enabled, sendJsonMessage, socketUrl]
  )

  const leave = useCallback(() => {
    sendJsonMessage({ type: "leave" } satisfies ClientMsg<T>)
  }, [sendJsonMessage])

  const envError =
    enabled && !socketUrl ? "VITE_ARENA_HOST is not configured" : null

  return {
    ...state,
    error: state.error ?? envError,
    connectionState: readyState,
    sendAction,
    leave
  }
}
