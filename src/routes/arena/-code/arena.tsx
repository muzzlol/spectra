import { useState } from "react"
import type { Participant } from "~/shared/arena-protocol"
import { FocusOverlay } from "../-components/focus-overlay"
import { PaneGrid } from "../-components/pane-grid"
import type { CursorData } from "../-hooks/use-arena-socket"
import { CodePane, type TestResult } from "./pane"

interface CodeArenaProps {
  userId: string
  participants: Participant[]
  isSpectator: boolean
  codeByParticipant: Record<string, string>
  testResultsByParticipant: Record<string, TestResult[]>
  cursors: Map<string, CursorData>
  onCodeChange: (code: string) => void
  onCursorMove: (line: number, column: number) => void
  prompt: string
}

export function CodeArena({
  userId,
  participants,
  isSpectator,
  codeByParticipant,
  testResultsByParticipant,
  cursors,
  onCodeChange,
  prompt
}: CodeArenaProps) {
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
      {/* Problem description panel */}
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

      {/* Editor grid */}
      <div className="flex-1 p-2">
        <PaneGrid paneCount={sortedParticipants.length}>
          {(index) => {
            const participant = sortedParticipants[index]
            const isOwner = participant.id === userId
            const cursor = cursors.get(participant.id)

            return (
              <CodePane
                key={participant.id}
                paneId={participant.id}
                ownerId={participant.id}
                ownerUsername={participant.username}
                isEditable={isOwner && !isSpectator}
                code={codeByParticipant[participant.id] ?? ""}
                testResults={testResultsByParticipant[participant.id] ?? []}
                cursor={isOwner ? undefined : cursor}
                onCodeChange={isOwner ? onCodeChange : undefined}
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
            isEditable={focusedParticipant.id === userId && !isSpectator}
            code={codeByParticipant[focusedParticipant.id] ?? ""}
            testResults={testResultsByParticipant[focusedParticipant.id] ?? []}
            cursor={
              focusedParticipant.id === userId
                ? undefined
                : cursors.get(focusedParticipant.id)
            }
            onCodeChange={
              focusedParticipant.id === userId ? onCodeChange : undefined
            }
          />
        )}
      </FocusOverlay>
    </div>
  )
}
