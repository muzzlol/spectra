import { useMutation } from "convex/react"
import { Copy, LogOut, Play, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { api } from "~/convex/_generated/api"
import type { Id } from "~/convex/_generated/dataModel"
import {
  type ArenaMode,
  type ArenaType,
  MODE_CONFIG
} from "~/convex/schema/arena"
import { ParticipantList } from "./participant-list"

interface ArenaLobbyProps {
  arenaId: Id<"arenas">
  type: ArenaType
  mode: ArenaMode
  maxPlayers: number
  timeLimit: number
  isHost: boolean
  isParticipant: boolean
  canJoin: boolean
  canStart: boolean
  canLeave: boolean
  playersNeeded: number
}

export function ArenaLobby({
  arenaId,
  type,
  mode,
  maxPlayers,
  timeLimit,
  isHost,
  isParticipant,
  canJoin,
  canStart,
  canLeave,
  playersNeeded
}: ArenaLobbyProps) {
  const join = useMutation(api.arenas.join)
  const leave = useMutation(api.arenas.leave)
  const start = useMutation(api.arenas.start)

  const handleJoin = async () => {
    try {
      await join({ arenaId })
      toast.success("Joined arena!")
    } catch (error) {
      toast.error("Failed to join arena")
      console.error(error)
    }
  }

  const handleLeave = async () => {
    try {
      await leave({ arenaId })
      toast.success(isHost ? "Arena cancelled" : "Left arena")
    } catch (error) {
      toast.error("Failed to leave arena")
      console.error(error)
    }
  }

  const handleStart = async () => {
    try {
      await start({ arenaId })
      toast.success("Game started!")
    } catch (error) {
      toast.error("Failed to start game")
      console.error(error)
    }
  }

  const handleCopyLink = async () => {
    const success = await navigator.clipboard
      .writeText(window.location.href)
      .then(() => true)
      .catch(() => false)

    if (!success) {
      toast.error("Failed to copy link to clipboard")
    }

    toast.success("Link copied to clipboard!")
  }

  const modeConfig = MODE_CONFIG[mode]
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md bg-secondary-background/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {isHost ? "Your Arena" : "Arena Lobby"}
          </CardTitle>
          <CardDescription>
            {isHost
              ? "Waiting for players to join..."
              : isParticipant
                ? "Waiting for host to start..."
                : "Join this arena to play!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Arena Info */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-sm bg-muted/50 p-2">
              <div className="font-mono text-muted-foreground text-xs uppercase">
                Type
              </div>
              <div className="font-medium text-sm capitalize">{type}</div>
            </div>
            <div className="rounded-sm bg-muted/50 p-2">
              <div className="font-mono text-muted-foreground text-xs uppercase">
                Mode
              </div>
              <div className="font-medium text-sm">{modeConfig.label}</div>
            </div>
            <div className="rounded-sm bg-muted/50 p-2">
              <div className="font-mono text-muted-foreground text-xs uppercase">
                Time
              </div>
              <div className="font-medium text-sm">{formatTime(timeLimit)}</div>
            </div>
          </div>

          {/* Participant List */}
          <ParticipantList arenaId={arenaId} maxPlayers={maxPlayers} />

          {/* Actions */}
          <div className="space-y-2">
            {/* Non-participant: Join button */}
            {canJoin && (
              <Button onClick={handleJoin} className="w-full">
                Join Arena
              </Button>
            )}

            {/* Host: Start button */}
            {isHost && (
              <Button
                onClick={handleStart}
                disabled={!canStart}
                className="w-full"
              >
                <Play className="mr-2 h-4 w-4" />
                {canStart
                  ? "Start Game"
                  : `Need ${playersNeeded} more player${playersNeeded > 1 ? "s" : ""}`}
              </Button>
            )}

            {/* Copy link button */}
            {isParticipant && (
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="w-full"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Invite Link
              </Button>
            )}

            {/* Leave/Cancel button */}
            {canLeave && (
              <Button
                variant="ghost"
                onClick={handleLeave}
                className="w-full text-muted-foreground hover:text-destructive"
              >
                {isHost ? (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Cancel Arena
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave Arena
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
