import { useCallback, useEffect, useRef, useState } from "react"
import type { Participant } from "~/shared/arena-protocol"
import { type TypingProgress, WpmDisplay } from "./wpm-display"

interface TypingArenaProps {
  userId: string
  participants: Participant[]
  isSpectator: boolean
  prompt: string
  progressByParticipant: Record<string, TypingProgress>
  onProgressUpdate: (progress: TypingProgress) => void
}

export function TypingArena({
  userId,
  participants,
  isSpectator,
  prompt,
  progressByParticipant,
  onProgressUpdate
}: TypingArenaProps) {
  const [input, setInput] = useState("")
  const [startTime, setStartTime] = useState<number | null>(null)
  const [errors, setErrors] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const totalChars = prompt.length
  const currentProgress = progressByParticipant[userId]
  const isFinished = currentProgress?.finished ?? false

  // Calculate WPM and accuracy
  const calculateStats = useCallback(
    (typed: string) => {
      const charIndex = typed.length
      const correctChars = typed
        .split("")
        .filter((char, i) => char === prompt[i]).length
      const totalTyped = typed.length
      const accuracy =
        totalTyped > 0 ? Math.round((correctChars / totalTyped) * 100) : 100

      let wpm = 0
      if (startTime) {
        const elapsedMinutes = (Date.now() - startTime) / 60000
        const words = correctChars / 5 // Standard: 5 chars = 1 word
        wpm = elapsedMinutes > 0 ? Math.round(words / elapsedMinutes) : 0
      }

      return { charIndex, wpm, accuracy, finished: charIndex >= totalChars }
    },
    [prompt, startTime, totalChars]
  )

  // Handle input change
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isSpectator || isFinished) return

      const value = e.target.value
      if (!startTime && value.length > 0) {
        setStartTime(Date.now())
      }

      // Check for errors
      const lastChar = value[value.length - 1]
      const expectedChar = prompt[value.length - 1]
      if (lastChar !== expectedChar) {
        setErrors((prev) => prev + 1)
      }

      setInput(value)

      const stats = calculateStats(value)
      onProgressUpdate({
        participantId: userId,
        ...stats
      })
    },
    [
      isSpectator,
      isFinished,
      startTime,
      prompt,
      calculateStats,
      onProgressUpdate,
      userId
    ]
  )

  // Focus input on mount
  useEffect(() => {
    if (!isSpectator && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isSpectator])

  // Render text with highlighting
  const renderText = () => {
    return prompt.split("").map((char, i) => {
      let className = "text-muted-foreground"

      if (i < input.length) {
        if (input[i] === char) {
          className = "text-foreground"
        } else {
          className = "bg-red-500/20 text-red-500"
        }
      } else if (i === input.length) {
        className = "bg-primary/20 text-primary"
      }

      return (
        <span key={i} className={className}>
          {char}
        </span>
      )
    })
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Text display area */}
      <div className="flex-1 rounded-lg border border-border bg-muted/20 p-6">
        <div
          className="cursor-text font-mono text-lg leading-relaxed"
          onClick={() => inputRef.current?.focus()}
        >
          {renderText()}
        </div>

        {/* Hidden input for capturing keystrokes */}
        {!isSpectator && (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInput}
            disabled={isFinished}
            className="absolute opacity-0"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        )}
      </div>

      {/* Stats and leaderboard */}
      <div className="grid shrink-0 grid-cols-1 gap-4 md:grid-cols-3">
        {/* Current user stats */}
        {!isSpectator && (
          <div className="rounded-md border border-border bg-background p-4 md:col-span-1">
            <div className="grid grid-cols-3 gap-4 text-center">
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
                <div className="font-mono text-2xl">{errors}</div>
                <div className="text-muted-foreground text-xs">Errors</div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className={isSpectator ? "md:col-span-3" : "md:col-span-2"}>
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
