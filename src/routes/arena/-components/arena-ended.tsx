import { Link } from "@tanstack/react-router"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
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

interface ArenaEndedProps {
  arenaId: Id<"arenas">
  type: ArenaType
  mode: ArenaMode
  maxPlayers: number
  startedAt?: number
  endedAt?: number
}

export function ArenaEnded({
  arenaId,
  type,
  mode,
  maxPlayers,
  startedAt,
  endedAt
}: ArenaEndedProps) {
  const modeConfig = MODE_CONFIG[mode]

  const duration =
    startedAt && endedAt ? Math.floor((endedAt - startedAt) / 1000) : null

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md bg-secondary-background/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Arena Ended</CardTitle>
          <CardDescription>
            This {type} ({modeConfig.label}) arena has concluded.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          {duration !== null && (
            <div className="rounded-sm bg-muted/50 p-4 text-center">
              <div className="font-mono text-muted-foreground text-xs uppercase">
                Duration
              </div>
              <div className="font-medium text-lg">
                {formatDuration(duration)}
              </div>
            </div>
          )}

          {/* Participants */}
          <ParticipantList
            arenaId={arenaId}
            maxPlayers={maxPlayers}
            showEmptySlots={false}
          />

          {/* Results placeholder */}
          <div className="rounded-sm border border-muted-foreground/30 border-dashed p-6 text-center">
            <p className="text-muted-foreground text-sm">
              Results and rankings will be displayed here once game logic is
              implemented.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link to="/">
                <RotateCcw className="mr-2 h-4 w-4" />
                Play Again
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
