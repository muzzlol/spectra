import { convexQuery } from "@convex-dev/react-query"
import { useSuspenseQuery } from "@tanstack/react-query"
import { useCurrentUser } from "@/hooks/use-user"
import { api } from "~/convex/_generated/api"
import type { Id } from "~/convex/_generated/dataModel"
import { MODE_CONFIG } from "~/convex/schema/arena"

export function useArena(arenaId: Id<"arenas">) {
  const { data: arena } = useSuspenseQuery(
    convexQuery(api.arenas.get, { arenaId })
  )

  const { user, isUserLoading } = useCurrentUser()
  const isHost = user?._id === arena.hostId
  const isParticipant = user?._id
    ? arena.participants.includes(user?._id)
    : false

  const currentPlayerCount = arena.participants.length

  const minPlayers = MODE_CONFIG[arena.mode].minPlayers
  const maxPlayers = arena.settings.maxPlayers

  return {
    arena,
    user,
    isUserLoading,
    isHost,
    isParticipant,

    canStart:
      isHost &&
      arena.status === "lobby" &&
      currentPlayerCount >= minPlayers &&
      currentPlayerCount <= maxPlayers,

    canJoin:
      !isParticipant &&
      arena.status === "lobby" &&
      currentPlayerCount < maxPlayers,

    canLeave: isParticipant && arena.status === "lobby",

    playersNeeded: Math.max(0, minPlayers - currentPlayerCount),

    isFull: currentPlayerCount >= maxPlayers,

    timeLeft: arena.startedAt
      ? arena.settings.timeLimit * 1000 - (Date.now() - arena.startedAt)
      : 0
  }
}
