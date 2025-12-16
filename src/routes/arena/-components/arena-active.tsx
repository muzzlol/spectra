import { Clock, Users, Wifi, WifiOff } from "lucide-react"
import { useCallback, useMemo } from "react"
import { Spinner } from "@/components/ui/spinner"
import { useCurrentUser } from "@/hooks/use-user"
import type { Id } from "~/convex/_generated/dataModel"
import type { ArenaMode, ArenaType } from "~/convex/schema/arena"
import { MODE_CONFIG } from "~/convex/schema/arena"
import { useArenaSocket } from "../-hooks/use-arena-socket"

interface ArenaActiveProps {
  arenaId: Id<"arenas">
  type: ArenaType
  mode: ArenaMode
  currentPlayerCount: number
  maxPlayers: number
  timeLimit: number
  startedAt: number
  prompt: string
}

export function ArenaActive({
  arenaId,
  type,
  mode,
  maxPlayers,
  timeLimit,
  prompt
}: ArenaActiveProps) {
  const { user } = useCurrentUser()
  const modeConfig = MODE_CONFIG[mode]

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

  const { connectionState, participants, timeRemaining, error } =
    useArenaSocket({
      arenaId,
      userId: user?._id ?? "",
      username: user?.username ?? "Anonymous",
      config,
      onGameOver: handleGameOver
    })

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const isLowTime = timeRemaining <= 30
  const isCriticalTime = timeRemaining <= 10

  const connectionIcon =
    connectionState === "connected" ? (
      <Wifi className="h-4 w-4 text-green-500" />
    ) : connectionState === "connecting" ? (
      <Spinner size="sm" />
    ) : (
      <WifiOff className="h-4 w-4 text-destructive" />
    )

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar with timer and info */}
      <div className="border-border border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              {connectionIcon}
              <span className="font-medium capitalize">{type}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{modeConfig.label}</span>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 font-bold font-mono text-xl ${
              isCriticalTime
                ? "animate-pulse text-destructive"
                : isLowTime
                  ? "text-yellow-500"
                  : ""
            }`}
          >
            <Clock className="h-5 w-5" />
            {formatTime(timeRemaining)}
          </div>

          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Users className="h-4 w-4" />
            {participants.length}/{maxPlayers} players
          </div>
        </div>
      </div>

      {/* Connection status / error */}
      {error && (
        <div className="bg-destructive/10 px-4 py-2 text-center text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Main game area */}
      <div className="flex flex-1 flex-col">
        {connectionState === "connecting" ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="mt-4 text-muted-foreground">
                Connecting to arena...
              </p>
            </div>
          </div>
        ) : connectionState === "connected" ? (
          <div className="flex flex-1 flex-col p-4">
            {/* Prompt display */}
            <div className="mb-4 rounded-md bg-muted/50 p-4 text-center">
              <p className="font-medium text-muted-foreground text-sm uppercase">
                Challenge
              </p>
              <p className="mt-1 text-lg">{prompt}</p>
            </div>

            {/* Game canvas placeholder */}
            <div className="flex flex-1 items-center justify-center rounded-md border border-muted-foreground/30 border-dashed bg-muted/20">
              <div className="text-center">
                <p className="text-muted-foreground">
                  {type === "draw"
                    ? "Excalidraw canvas will render here"
                    : type === "code"
                      ? "Code editor will render here"
                      : "Typing test will render here"}
                </p>
                <p className="mt-2 text-muted-foreground text-sm">
                  Connected participants:{" "}
                  {participants.map((p) => p.username).join(", ")}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <WifiOff className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                Disconnected from arena
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
