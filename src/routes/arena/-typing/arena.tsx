import { useMemo } from "react"
import type { TypingProgress } from "~/shared/arena-protocol"
import type { ArenaComponentProps } from "../-props"
import { WpmDisplay } from "./wpm-display"

type TypingArenaProps = ArenaComponentProps<"typing">

// WIP
export function TypingArena({
  userId,
  participants,
  prompt,
  data
}: TypingArenaProps) {
  const progressByParticipant: Record<string, TypingProgress> =
    data?.progress ?? {}
  const totalChars = prompt.length
  const currentProgress = progressByParticipant[userId]
  const participantCount = participants.length

  const previewText = useMemo(() => prompt.slice(0, 320), [prompt])

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="rounded-lg border border-border bg-muted/20 p-6">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Prompt
        </p>
        <p className="mt-3 whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {previewText}
          {prompt.length > previewText.length ? "..." : ""}
        </p>
        <div className="mt-4 rounded border border-border border-dashed bg-background/60 px-3 py-2 text-muted-foreground text-xs">
          Typing mode is WIP. Input and progress submission are disabled in this
          commit.
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-md border border-border bg-background p-4 md:col-span-1">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Your Stats
          </p>
          <div className="mt-3 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-mono text-2xl">
                {currentProgress?.wpm ?? 0}
              </div>
              <div className="text-muted-foreground text-xs">WPM</div>
            </div>
            <div>
              <div className="font-mono text-2xl">
                {currentProgress?.accuracy ?? 100}%
              </div>
              <div className="text-muted-foreground text-xs">Accuracy</div>
            </div>
            <div>
              <div className="font-mono text-2xl">{participantCount}</div>
              <div className="text-muted-foreground text-xs">Players</div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <WpmDisplay
            participants={participants}
            progressByParticipant={progressByParticipant}
            totalChars={totalChars}
            userId={userId}
          />
        </div>
      </div>
    </div>
  )
}
