import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types"
import { useMemo, useState } from "react"
import type { CursorPos } from "~/shared/arena-protocol"
import { FocusOverlay } from "../-components/focus-overlay"
import { PaneGrid } from "../-components/pane-grid"
import type { ArenaComponentProps } from "../-props"
import { DrawCanvas } from "./canvas"

type DrawArenaProps = ArenaComponentProps<"draw">

// WIP
export function DrawArena({
  userId,
  participants,
  prompt,
  data
}: DrawArenaProps) {
  const [focusedPaneId, setFocusedPaneId] = useState<string | null>(null)

  const elementsByParticipant: Record<string, ExcalidrawElement[]> =
    data?.playerElements ?? {}
  const cursorsByParticipant: Record<string, CursorPos> =
    data?.playerCursors ?? {}

  const sortedParticipants = useMemo(
    () =>
      [...participants].sort((a, b) => {
        if (a.id === userId) return -1
        if (b.id === userId) return 1
        return 0
      }),
    [participants, userId]
  )

  const focusedParticipant = focusedPaneId
    ? participants.find((p) => p.id === focusedPaneId)
    : null

  if (sortedParticipants.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-border border-b bg-muted/30 px-4 py-3 text-center">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Challenge
          </p>
          <p className="mt-1 text-base">{prompt}</p>
        </div>
        <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
          Waiting for participants...
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Prompt display */}
      <div className="shrink-0 border-border border-b bg-muted/30 px-4 py-3 text-center">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Challenge
        </p>
        <p className="mt-1 text-base">{prompt}</p>
        <p className="mt-1 text-muted-foreground text-xs">
          Draw mode is WIP. Canvas is currently read-only.
        </p>
      </div>

      <div className="flex-1 p-2">
        <PaneGrid paneCount={sortedParticipants.length}>
          {(index) => {
            const participant = sortedParticipants[index]
            const isOwner = participant.id === userId
            const paneCursors = Object.entries(cursorsByParticipant)
              .filter(([participantId]) => participantId !== participant.id)
              .map(([participantId, cursor]) => ({
                participantId,
                ...cursor
              }))

            return (
              <DrawCanvas
                key={participant.id}
                paneId={participant.id}
                ownerId={participant.id}
                ownerUsername={participant.username}
                isEditable={false}
                elements={elementsByParticipant[participant.id] ?? []}
                cursors={isOwner ? [] : paneCursors}
                onFocus={() => setFocusedPaneId(participant.id)}
              />
            )
          }}
        </PaneGrid>
      </div>

      <FocusOverlay
        isOpen={focusedPaneId !== null}
        onClose={() => setFocusedPaneId(null)}
        ownerUsername={focusedParticipant?.username}
        isOwner={focusedPaneId === userId}
      >
        {focusedParticipant && (
          <DrawCanvas
            paneId={focusedParticipant.id}
            ownerId={focusedParticipant.id}
            ownerUsername={focusedParticipant.username}
            isEditable={false}
            elements={elementsByParticipant[focusedParticipant.id] ?? []}
            cursors={
              focusedParticipant.id === userId
                ? []
                : Object.entries(cursorsByParticipant).map(
                    ([participantId, cursor]) => ({
                      participantId,
                      ...cursor
                    })
                  )
            }
          />
        )}
      </FocusOverlay>
    </div>
  )
}
