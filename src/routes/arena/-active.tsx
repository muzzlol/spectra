import { WifiOff } from "lucide-react"
import { type ReactNode, useCallback, useMemo, useRef } from "react"
import { ReadyState } from "react-use-websocket"
import { Spinner } from "@/components/ui/spinner"
import { useCurrentUser } from "@/hooks/use-user"
import type { Id } from "~/convex/_generated/dataModel"
import type { ArenaMode, ArenaType } from "~/convex/schema/arena"
import type {
  ArenaData,
  ArenaEndReason,
  ArenaEvent,
  ArenaResults
} from "~/shared/arena-protocol"
import { CodeArena } from "./-code/arena"
import { ArenaHeader } from "./-components/header"
import { DrawArena } from "./-draw/arena"
import { createEventBridge, type EventBridge } from "./-event-bridge"
import { useArenaSocket } from "./-hooks/use-arena-socket"
import { TypingArena } from "./-typing/arena"

interface ArenaActiveProps {
  arenaId: Id<"arenas">
  type: ArenaType
  mode: ArenaMode
  maxPlayers: number
  timeLimit: number
  prompt: string
  participantIds?: Id<"users">[]
}

interface ArenaLayoutProps {
  type: ArenaType
  mode: ArenaMode
  connectionState: ReadyState
  timeRemaining: number
  participantCount: number
  maxPlayers: number
  error: string | null
  children: ReactNode
}

function ArenaLayout({
  type,
  mode,
  connectionState,
  timeRemaining,
  participantCount,
  maxPlayers,
  error,
  children
}: ArenaLayoutProps) {
  return (
    <div className="flex h-screen flex-col">
      <ArenaHeader
        type={type}
        mode={mode}
        connectionState={connectionState}
        timeRemaining={timeRemaining}
        participantCount={participantCount}
        maxPlayers={maxPlayers}
      />

      {error && (
        <div className="shrink-0 bg-destructive/10 px-4 py-2 text-center text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}

export function ArenaActive({
  arenaId,
  type,
  mode,
  maxPlayers,
  timeLimit,
  prompt,
  participantIds = []
}: ArenaActiveProps) {
  const { user } = useCurrentUser()
  const userId = user?._id ?? ""
  const bridgeRef = useRef<EventBridge<ArenaEvent<ArenaType>>>(
    createEventBridge<ArenaEvent<ArenaType>>()
  )

  const config = useMemo(
    () => ({
      arenaId,
      type,
      mode,
      timeLimit,
      prompt,
      hostId: userId
    }),
    [arenaId, mode, prompt, timeLimit, type, userId]
  )

  const handleGameOver = useCallback(
    (reason: ArenaEndReason, _results: ArenaResults) => {
      console.log("Game over:", reason)
    },
    []
  )

  const handleArenaEvent = useCallback((event: ArenaEvent<ArenaType>) => {
    bridgeRef.current.emit(event)
  }, [])

  const {
    connectionState,
    participants,
    data,
    timeRemaining,
    error,
    sendAction
  } = useArenaSocket({
    arenaId,
    userId,
    username: user?.username ?? "Anonymous",
    config,
    enabled: Boolean(user),
    onGameOver: handleGameOver,
    onArenaEvent: handleArenaEvent
  })

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const isSpectator =
    participantIds.length > 0 && !participantIds.includes(user._id)

  if (connectionState === ReadyState.CONNECTING) {
    return (
      <ArenaLayout
        type={type}
        mode={mode}
        connectionState={connectionState}
        timeRemaining={timeRemaining}
        participantCount={participants.length}
        maxPlayers={maxPlayers}
        error={error}
      >
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-muted-foreground">Connecting to arena...</p>
          </div>
        </div>
      </ArenaLayout>
    )
  }

  if (connectionState !== ReadyState.OPEN) {
    return (
      <ArenaLayout
        type={type}
        mode={mode}
        connectionState={connectionState}
        timeRemaining={timeRemaining}
        participantCount={participants.length}
        maxPlayers={maxPlayers}
        error={error}
      >
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <WifiOff className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              Disconnected from arena
            </p>
          </div>
        </div>
      </ArenaLayout>
    )
  }

  const arenaContent = ((): ReactNode => {
    switch (type) {
      case "draw":
        return (
          <DrawArena
            userId={user._id}
            data={data as ArenaData<"draw"> | null}
            participants={participants}
            isSpectator={isSpectator}
            prompt={prompt}
            sendAction={sendAction}
            eventBridge={bridgeRef.current as EventBridge<ArenaEvent<"draw">>}
          />
        )

      case "code":
        return (
          <CodeArena
            userId={user._id}
            data={data as ArenaData<"code"> | null}
            participants={participants}
            isSpectator={isSpectator}
            prompt={prompt}
            sendAction={sendAction}
            eventBridge={bridgeRef.current as EventBridge<ArenaEvent<"code">>}
          />
        )

      case "typing":
        return (
          <TypingArena
            userId={user._id}
            data={data as ArenaData<"typing"> | null}
            participants={participants}
            isSpectator={isSpectator}
            prompt={prompt}
            sendAction={sendAction}
            eventBridge={bridgeRef.current as EventBridge<ArenaEvent<"typing">>}
          />
        )

      default: {
        const _exhaustive: never = type
        console.error(`Unsupported arena type: ${_exhaustive}`)
        return null
      }
    }
  })()

  return (
    <ArenaLayout
      type={type}
      mode={mode}
      connectionState={connectionState}
      timeRemaining={timeRemaining}
      participantCount={participants.length}
      maxPlayers={maxPlayers}
      error={error}
    >
      {/* WIP */}
      {arenaContent}
    </ArenaLayout>
  )
}
