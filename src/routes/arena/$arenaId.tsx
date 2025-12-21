import { convexQuery } from "@convex-dev/react-query"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { Spinner } from "@/components/ui/spinner"
import { api } from "~/convex/_generated/api"
import type { Id } from "~/convex/_generated/dataModel"
import { ArenaActive } from "./-components/arena-active"
import { ArenaEnded } from "./-components/arena-ended"
import { ArenaLobby } from "./-components/arena-lobby"
import { GuestOverlay } from "./-components/guest-overlay"
import { useArena } from "./-hooks/use-arena"

export const Route = createFileRoute("/arena/$arenaId")({
  loader: async ({ context, params }) => {
    const arena = await context.queryClient.ensureQueryData(
      convexQuery(api.arenas.get, { arenaId: params.arenaId as Id<"arenas"> })
    )

    if (!arena) {
      throw notFound({ routeId: Route.id })
    }
    return { arena }
  },
  component: Arena
})

function Arena() {
  const { arenaId } = Route.useParams() as { arenaId: Id<"arenas"> }
  const {
    arena,
    type,
    mode,
    user,
    currentPlayerCount,
    maxPlayers,
    timeLimit,
    isUserLoading,
    isHost,
    isParticipant,
    canJoin,
    canStart,
    canLeave,
    playersNeeded
  } = useArena(arenaId)

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <GuestOverlay />
  }

  switch (arena.status) {
    case "lobby":
      return (
        <ArenaLobby
          arenaId={arenaId}
          type={type}
          mode={mode}
          maxPlayers={maxPlayers}
          timeLimit={timeLimit}
          isHost={isHost}
          isParticipant={isParticipant}
          canJoin={canJoin}
          canStart={canStart}
          canLeave={canLeave}
          playersNeeded={playersNeeded}
        />
      )
    case "active":
      return (
        <ArenaActive
          arenaId={arenaId}
          type={type}
          mode={mode}
          currentPlayerCount={currentPlayerCount}
          maxPlayers={maxPlayers}
          timeLimit={timeLimit}
          prompt={arena.settings.prompt}
          participantIds={arena.participants}
        />
      )
    case "ended":
      return (
        <ArenaEnded
          arenaId={arenaId}
          type={type}
          mode={mode}
          maxPlayers={maxPlayers}
          startedAt={arena.startedAt}
          endedAt={arena.endedAt!}
        />
      )
  }
}
