import { convexQuery } from "@convex-dev/react-query"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { api } from "~/convex/_generated/api"
import type { Id } from "~/convex/_generated/dataModel"

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
  const { arenaId } = Route.useParams()
  return (
    <div>
      {JSON.stringify({
        type,
        mode,
        status,
        participants,
        settings,
        startedAt
      })}
      !
    </div>
  )
}
