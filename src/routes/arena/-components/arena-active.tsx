import { Clock, Users } from "lucide-react"
import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import type { Id } from "~/convex/_generated/dataModel"
import type { ArenaMode, ArenaType } from "~/convex/schema/arena"
import { MODE_CONFIG } from "~/convex/schema/arena"
import { ParticipantList } from "./participant-list"

interface ArenaActiveProps {
  arenaId: Id<"arenas">
  type: ArenaType
  mode: ArenaMode
  maxPlayers: number
  timeLimit: number
  startedAt: number
}

function useCountdown(startedAt: number, durationSeconds: number) {
  const [remaining, setRemaining] = useState(() => {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000)
    return Math.max(0, durationSeconds - elapsed)
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      const newRemaining = Math.max(0, durationSeconds - elapsed)
      setRemaining(newRemaining)

      if (newRemaining === 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [startedAt, durationSeconds])

  return remaining
}

export function ArenaActive({
  arenaId,
  type,
  mode,
  maxPlayers,
  timeLimit,
  startedAt
}: ArenaActiveProps) {
  const remaining = useCountdown(startedAt, timeLimit)
  const modeConfig = MODE_CONFIG[mode]

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const isLowTime = remaining <= 30
  const isCriticalTime = remaining <= 10

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar with timer and info */}
      <div className="border-border border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
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
            {formatTime(remaining)}
          </div>

          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Users className="h-4 w-4" />
            {maxPlayers} players
          </div>
        </div>
      </div>

      {/* Main game area - placeholder */}
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-secondary-background/80 backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Game in Progress</CardTitle>
            <CardDescription>
              The {type} challenge is active. Durable Object integration coming
              soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ParticipantList arenaId={arenaId} maxPlayers={maxPlayers} />

            <div className="rounded-sm border border-muted-foreground/30 border-dashed p-8 text-center">
              <p className="text-muted-foreground text-sm">
                Game canvas will render here once connected to Durable Object
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
