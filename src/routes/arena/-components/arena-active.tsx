import { WifiOff } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { ReadyState } from "react-use-websocket"
import { Spinner } from "@/components/ui/spinner"
import { useCurrentUser } from "@/hooks/use-user"
import type { Id } from "~/convex/_generated/dataModel"
import type { ArenaMode, ArenaType } from "~/convex/schema/arena"
import { CodeArena } from "../-code/arena"
import type { TestResult } from "../-code/pane"
import { DrawArena } from "../-draw/arena"
import { useArenaSocket } from "../-hooks/use-arena-socket"
import { TypingArena } from "../-typing/arena"
import type { TypingProgress } from "../-typing/wpm-display"
import { ArenaHeader } from "./arena-header"

interface ArenaActiveProps {
  arenaId: Id<"arenas">
  type: ArenaType
  mode: ArenaMode
  currentPlayerCount: number
  maxPlayers: number
  timeLimit: number
  prompt: string
  participantIds?: Id<"users">[]
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

  // Type-specific state (will be managed by actual implementations)
  const [codeByParticipant] = useState<Record<string, string>>({})
  const [testResultsByParticipant] = useState<Record<string, TestResult[]>>({})
  const [typingProgress] = useState<Record<string, TypingProgress>>({})

  const config = useMemo(
    () => ({
      arenaId,
      type,
      mode,
      timeLimit,
      prompt,
      hostId: user?._id ?? ("" as Id<"users">)
    }),
    [arenaId, type, mode, timeLimit, prompt, user?._id]
  )

  const handleGameOver = useCallback((reason: string) => {
    console.log("Game over:", reason)
  }, [])

  const {
    connectionState,
    participants,
    elements,
    cursors,
    timeRemaining,
    error,
    sendElements,
    sendCursor
  } = useArenaSocket({
    arenaId,
    userId: user?._id ?? "",
    username: user?.username ?? "Anonymous",
    config,
    onGameOver: handleGameOver
  })

  // Spectator detection: user is not in the participant list
  const isSpectator = user
    ? !participantIds.includes(user._id) && participantIds.length > 0
    : true

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  // Connection states
  if (connectionState === ReadyState.CONNECTING) {
    return (
      <div className="flex min-h-screen flex-col">
        <ArenaHeader
          type={type}
          mode={mode}
          connectionState={connectionState}
          timeRemaining={timeRemaining}
          participantCount={participants.length}
          maxPlayers={maxPlayers}
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-muted-foreground">Connecting to arena...</p>
          </div>
        </div>
      </div>
    )
  }

  if (connectionState !== ReadyState.OPEN) {
    return (
      <div className="flex min-h-screen flex-col">
        <ArenaHeader
          type={type}
          mode={mode}
          connectionState={connectionState}
          timeRemaining={timeRemaining}
          participantCount={participants.length}
          maxPlayers={maxPlayers}
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <WifiOff className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              Disconnected from arena
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <ArenaHeader
        type={type}
        mode={mode}
        connectionState={connectionState}
        timeRemaining={timeRemaining}
        participantCount={participants.length}
        maxPlayers={maxPlayers}
      />

      {/* Error banner */}
      {error && (
        <div className="shrink-0 bg-destructive/10 px-4 py-2 text-center text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Type-specific arena content */}
      <div className="flex-1 overflow-hidden">
        {type === "draw" && (
          <DrawArena
            userId={user._id}
            participants={participants}
            isSpectator={isSpectator}
            elements={elements}
            cursors={cursors}
            onElementsChange={sendElements}
            onCursorMove={sendCursor}
            prompt={prompt}
          />
        )}

        {type === "code" && (
          <CodeArena
            userId={user._id}
            participants={participants}
            isSpectator={isSpectator}
            codeByParticipant={codeByParticipant}
            testResultsByParticipant={testResultsByParticipant}
            cursors={cursors}
            onCodeChange={(code) => {
              // TODO: Integrate with actual code sync
              console.log("Code changed:", code.length, "chars")
            }}
            onCursorMove={(line, col) => {
              // For code, we might want to send line/col instead of x/y
              sendCursor(line, col)
            }}
            prompt={prompt}
          />
        )}

        {type === "typing" && (
          <TypingArena
            userId={user._id}
            participants={participants}
            isSpectator={isSpectator}
            prompt={prompt}
            progressByParticipant={typingProgress}
            onProgressUpdate={(progress) => {
              // TODO: Integrate with actual progress sync
              console.log("Progress update:", progress)
            }}
          />
        )}
      </div>
    </div>
  )
}
