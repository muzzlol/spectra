import { useState } from "react"
import type { Participant } from "~/shared/arena-protocol"
import { FocusOverlay } from "../-components/focus-overlay"
import { PaneGrid } from "../-components/pane-grid"
import type { CursorData } from "../-hooks/use-arena-socket"
import { DrawCanvas } from "./canvas"

interface DrawArenaProps {
  userId: string
  participants: Participant[]
  isSpectator: boolean
  elements: unknown[]
  cursors: Map<string, CursorData>
  onElementsChange: (elements: unknown[]) => void
  onCursorMove: (x: number, y: number) => void
  prompt: string
}

export function DrawArena({
  userId,
  participants,
  isSpectator,
  elements,
  cursors,
  onElementsChange,
  onCursorMove,
  prompt
}: DrawArenaProps) {
  const [focusedPaneId, setFocusedPaneId] = useState<string | null>(null)

  // Sort participants so current user is first (if not spectator)
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.id === userId) return -1
    if (b.id === userId) return 1
    return 0
  })

  const focusedParticipant = focusedPaneId
    ? participants.find((p) => p.id === focusedPaneId)
    : null

  return (
    <div className="flex h-full flex-col">
      {/* Prompt display */}
      <div className="shrink-0 border-border border-b bg-muted/30 px-4 py-3 text-center">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Challenge
        </p>
        <p className="mt-1 text-base">{prompt}</p>
      </div>

      <div className="flex-1 p-2">
        <PaneGrid paneCount={sortedParticipants.length}>
          {(index) => {
            const participant = sortedParticipants[index]
            const isOwner = participant.id === userId
            const paneCursors = Array.from(cursors.values()).filter(
              (c) => c.participantId !== participant.id
            )

            return (
              <DrawCanvas
                key={participant.id}
                paneId={participant.id}
                ownerId={participant.id}
                ownerUsername={participant.username}
                isEditable={isOwner && !isSpectator}
                elements={elements}
                cursors={isOwner ? [] : paneCursors}
                onElementsChange={isOwner ? onElementsChange : undefined}
                onCursorMove={isOwner ? onCursorMove : undefined}
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
            isEditable={focusedParticipant.id === userId && !isSpectator}
            elements={elements}
            cursors={
              focusedParticipant.id === userId
                ? []
                : Array.from(cursors.values())
            }
            onElementsChange={
              focusedParticipant.id === userId ? onElementsChange : undefined
            }
            onCursorMove={
              focusedParticipant.id === userId ? onCursorMove : undefined
            }
          />
        )}
      </FocusOverlay>
    </div>
  )
}
