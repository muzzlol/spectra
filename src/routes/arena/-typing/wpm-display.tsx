import { Trophy } from "lucide-react"
import type { Participant, TypingProgress } from "~/shared/arena-protocol"

interface WpmDisplayProps {
  participants: Participant[]
  progressByParticipant: Record<string, TypingProgress>
  totalChars: number
  userId: string
}

export function WpmDisplay({
  participants,
  progressByParticipant,
  totalChars,
  userId
}: WpmDisplayProps) {
  // Sort by: finished first, then by charIndex descending
  const sortedParticipants = [...participants].sort((a, b) => {
    const progressA = progressByParticipant[a.id]
    const progressB = progressByParticipant[b.id]

    if (progressA?.finished && !progressB?.finished) return -1
    if (!progressA?.finished && progressB?.finished) return 1

    return (progressB?.charIndex ?? 0) - (progressA?.charIndex ?? 0)
  })

  return (
    <div className="rounded-md border border-border bg-background">
      <div className="border-border border-b px-4 py-2">
        <h3 className="font-medium text-sm">Leaderboard</h3>
      </div>
      <div className="divide-y divide-border">
        {sortedParticipants.map((participant, index) => {
          const progress = progressByParticipant[participant.id]
          const isCurrentUser = participant.id === userId
          const progressPercent = progress
            ? Math.round((progress.charIndex / totalChars) * 100)
            : 0

          return (
            <div
              key={participant.id}
              className={`flex items-center gap-3 px-4 py-2 ${
                isCurrentUser ? "bg-primary/5" : ""
              }`}
            >
              {/* Rank */}
              <div className="flex w-6 shrink-0 items-center justify-center">
                {index === 0 && progress?.finished ? (
                  <Trophy className="h-4 w-4 text-yellow-500" />
                ) : (
                  <span className="text-muted-foreground text-sm">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Name and progress bar */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`truncate text-sm ${isCurrentUser ? "font-medium" : ""}`}
                  >
                    {participant.username}
                  </span>
                  {isCurrentUser && (
                    <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-primary text-xs">
                      You
                    </span>
                  )}
                  {progress?.finished && (
                    <span className="shrink-0 rounded bg-green-500/10 px-1.5 py-0.5 text-green-500 text-xs">
                      Done
                    </span>
                  )}
                </div>
                {/* Progress bar */}
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all duration-300 ${
                      progress?.finished ? "bg-green-500" : "bg-primary"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="shrink-0 text-right">
                <div className="font-mono text-sm">
                  {progress?.wpm ?? 0}{" "}
                  <span className="text-muted-foreground text-xs">WPM</span>
                </div>
                <div className="text-muted-foreground text-xs">
                  {progress?.accuracy ?? 100}% acc
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
