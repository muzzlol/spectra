import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import { Crown, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "~/convex/_generated/api"
import type { Id } from "~/convex/_generated/dataModel"

interface ParticipantListProps {
  arenaId: Id<"arenas">
  maxPlayers: number
  className?: string
  showEmptySlots?: boolean
}

export function ParticipantList({
  arenaId,
  maxPlayers,
  className,
  showEmptySlots = true
}: ParticipantListProps) {
  const { data, isPending } = useQuery(
    convexQuery(api.arenas.getParticipants, { arenaId })
  )

  if (isPending) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="text-muted-foreground text-sm">Loading players...</div>
      </div>
    )
  }

  const participants = data?.participants ?? []
  const hostId = data?.hostId
  const emptySlots = maxPlayers - participants.length

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Players</span>
        <span className="font-mono text-muted-foreground">
          {participants.length}/{maxPlayers}
        </span>
      </div>
      <ul className="space-y-1">
        {participants.map((participant) => (
          <li
            key={participant._id}
            className="flex items-center gap-2 rounded-sm bg-muted/50 px-3 py-2"
          >
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 truncate font-medium text-sm">
              {participant.username}
            </span>
            {participant._id === hostId && (
              <Crown className="h-4 w-4 text-yellow-500" />
            )}
          </li>
        ))}
        {showEmptySlots &&
          Array.from({ length: emptySlots }).map((_, i) => (
            <li
              key={`empty-${i}`}
              className="flex items-center gap-2 rounded-sm border border-muted-foreground/30 border-dashed px-3 py-2"
            >
              <User className="h-4 w-4 text-muted-foreground/30" />
              <span className="text-muted-foreground/50 text-sm">
                Waiting for player...
              </span>
            </li>
          ))}
      </ul>
    </div>
  )
}
