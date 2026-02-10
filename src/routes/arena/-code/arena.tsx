import { useMemo, useState } from "react"
import type { CursorPos, RunResult } from "~/shared/arena-protocol"
import { FocusOverlay } from "../-components/focus-overlay"
import { PaneGrid } from "../-components/pane-grid"
import type { ArenaComponentProps } from "../-props"
import { CodePane } from "./pane"

type CodeArenaProps = ArenaComponentProps<"code">

// WIP
export function CodeArena({
  userId,
  participants,
  prompt,
  data
}: CodeArenaProps) {
  const [focusedPaneId, setFocusedPaneId] = useState<string | null>(null)
  const codeByParticipant: Record<string, string> = data?.playerCode ?? {}
  const testResultsByParticipant: Record<string, RunResult[]> =
    data?.testResults ?? {}
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
        <div className="shrink-0 border-border border-b bg-muted/30">
          <div className="px-4 py-3">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Problem
            </p>
            <div className="mt-2 text-sm">
              <p>{prompt}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
          Waiting for participants...
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Problem description panel */}
      <div className="shrink-0 border-border border-b bg-muted/30">
        <div className="px-4 py-3">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Problem
          </p>
          <div className="mt-2 text-sm">
            <p>{prompt}</p>
          </div>
          <p className="mt-2 text-muted-foreground text-xs">
            Code mode is WIP. Editors are currently read-only.
          </p>
        </div>
      </div>

      {/* Editor grid */}
      <div className="flex-1 p-2">
        <PaneGrid paneCount={sortedParticipants.length}>
          {(index) => {
            const participant = sortedParticipants[index]
            const isOwner = participant.id === userId
            const cursor = cursorsByParticipant[participant.id]

            return (
              <CodePane
                key={participant.id}
                paneId={participant.id}
                ownerId={participant.id}
                ownerUsername={participant.username}
                isEditable={false}
                code={codeByParticipant[participant.id] ?? ""}
                testResults={testResultsByParticipant[participant.id] ?? []}
                cursor={isOwner ? undefined : cursor}
                onFocus={() => setFocusedPaneId(participant.id)}
              />
            )
          }}
        </PaneGrid>
      </div>

      {/* Focus overlay */}
      <FocusOverlay
        isOpen={focusedPaneId !== null}
        onClose={() => setFocusedPaneId(null)}
        ownerUsername={focusedParticipant?.username}
        isOwner={focusedPaneId === userId}
      >
        {focusedParticipant && (
          <CodePane
            paneId={focusedParticipant.id}
            ownerId={focusedParticipant.id}
            ownerUsername={focusedParticipant.username}
            isEditable={false}
            code={codeByParticipant[focusedParticipant.id] ?? ""}
            testResults={testResultsByParticipant[focusedParticipant.id] ?? []}
            cursor={
              focusedParticipant.id === userId
                ? undefined
                : cursorsByParticipant[focusedParticipant.id]
            }
          />
        )}
      </FocusOverlay>
    </div>
  )
}
