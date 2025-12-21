import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types"
import type { ArenaMode, ArenaType } from "~/convex/schema/arena"
export type ArenaConfig<T extends ArenaType> = {
  arenaId: string
  type: T
  mode: ArenaMode
  prompt: string
  timeLimit: number
  hostId: string
}

export type ArenaState<T extends ArenaType> = {
  config: ArenaConfig<T> | null
  startedAt: number | null
  data: ArenaData<T> | null
}

export type ArenaData<T extends ArenaType> = T extends "draw"
  ? DrawData
  : T extends "code"
    ? CodeData
    : T extends "typing"
      ? TypingData
      : never

export type DrawData = {
  playerElements: Record<string, ExcalidrawElement[]>
  playerCursors: Record<string, CursorPos>
}
export type CodeData = {
  language: "python" | "javascript" | "typescript"
  playerCode: Record<string, string>
  testResults: Record<string, RunResult[]>
  playerCursors: Record<string, CursorPos> // x: line, y: col
}

export type CanvasUpdate = {
  type: "canvas_update"
  elements: ExcalidrawElement[]
}
export type RunResult = {
  passed: boolean
  output: string
  time?: number
}

export type TypingData = {
  progress: Record<string, TypingProgress>
}

export type TypingProgress = {
  charIndex: number
  wpm: number
  accuracy: number
  finished: boolean
}

export type TypingProgressUpdate = {
  type: "progress"
  progress: TypingProgress
}

export type CursorPos = { x: number; y: number }

export type CodeUpdate = { type: "code_update"; code: string }
export type CodeRun = { type: "run" }
export type RunResultUpdate = { type: "run_result"; result: RunResult[] }

export type ClientMsg<T extends ArenaType> =
  | { type: "init"; userId: string; username: string; config?: ArenaConfig<T> }
  | { type: "leave" }
  | ClientAction<T>

export type ClientAction<T extends ArenaType> = T extends "draw"
  ? DrawAction
  : T extends "code"
    ? CodeAction
    : T extends "typing"
      ? TypingAction
      : never

export type CursorUpdate = { type: "cursor" } & CursorPos

export type DrawAction = CursorUpdate | CanvasUpdate
export type CodeAction = CursorUpdate | CodeUpdate | CodeRun

export type TypingAction = TypingProgressUpdate

export type ServerMsg<T extends ArenaType> =
  | {
      type: "state"
      participants: Participant[]
      gameState: ArenaData<T> | null
      timeRemaining: number
    }
  | { type: "tick"; timeRemaining: number }
  | { type: "participant_joined"; participant: Participant }
  | { type: "participant_left"; participantId: string }
  | { type: "game_over"; reason: GameEndReason; results: GameResults }
  | { type: "error"; message: string }
  | ServerEvent<T>

export type ServerEvent<T extends ArenaType> = T extends "draw"
  ? DrawEvent
  : T extends "code"
    ? CodeEvent
    : T extends "typing"
      ? TypingEvent
      : never

export type Attributed<T> = T & { participantId: string }
export type DrawEvent = Attributed<CursorUpdate> | Attributed<CanvasUpdate>
export type CodeEvent =
  | Attributed<CursorUpdate>
  | Attributed<CodeUpdate>
  | Attributed<CodeRun>
  | Attributed<RunResultUpdate>

export type TypingEvent = Attributed<TypingProgressUpdate>

export type Participant = {
  id: string
  username: string
  joinedAt: number
}
export type SessionAttachment = { participantId: string } & Pick<
  Participant,
  "username" | "joinedAt"
>
export type GameEndReason = "completed" | "host_left" | "abandoned"

export type GameResults = {
  arenaId: string
  endReason: GameEndReason
  duration: number
  participants: Array<
    Participant & {
      score?: number
    }
  >
  finalElements?: unknown[] // TODO: figure out what to do with this
}
