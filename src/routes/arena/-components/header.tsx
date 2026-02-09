import { Clock, Users, Wifi, WifiOff } from "lucide-react"
import { ReadyState } from "react-use-websocket"
import { Spinner } from "@/components/ui/spinner"
import type { ArenaMode, ArenaType } from "~/convex/schema/arena"
import { MODE_CONFIG } from "~/convex/schema/arena"

interface ArenaHeaderProps {
  type: ArenaType
  mode: ArenaMode
  connectionState: ReadyState
  timeRemaining: number
  participantCount: number
  maxPlayers: number
}

export function ArenaHeader({
  type,
  mode,
  connectionState,
  timeRemaining,
  participantCount,
  maxPlayers
}: ArenaHeaderProps) {
  const modeConfig = MODE_CONFIG[mode]

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const isLowTime = timeRemaining <= 30
  const isCriticalTime = timeRemaining <= 10

  const connectionIcon =
    connectionState === ReadyState.OPEN ? (
      <Wifi className="h-4 w-4 text-green-500" />
    ) : connectionState === ReadyState.CONNECTING ? (
      <Spinner size="sm" />
    ) : (
      <WifiOff className="h-4 w-4 text-destructive" />
    )

  return (
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
          {participantCount}/{maxPlayers} players
        </div>
      </div>
    </div>
  )
}

