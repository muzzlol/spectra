import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types"
import type { ArenaMode, ArenaType } from "~/convex/schema/arena"

// ===== COMMON TYPES =====

export type Participant = {
  id: string
  username: string
  joinedAt: number
}

export type SessionAttachment = { participantId: string } & Pick<
  Participant,
  "username" | "joinedAt"
>

export type Attributed<T> = T & { participantId: string }

export type ArenaEndReason = "completed" | "host_left" | "abandoned"

export type CursorPos = { x: number; y: number }

// ===== ARENA CONFIGURATION =====

export type ArenaConfig = {
  arenaId: string
  type: ArenaType
  mode: ArenaMode
  prompt: string
  timeLimit: number
  hostId: string
}

// ===== ARENA DATA TYPES =====

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

// ===== CLIENT-SIDE ACTIONS =====

export type CursorUpdate = { type: "cursor" } & CursorPos

export type CanvasUpdate = {
  type: "canvas_update"
  elements: ExcalidrawElement[]
}

export type CodeUpdate = { type: "code_update"; code: string }
export type CodeRun = { type: "run" }
export type RunResultUpdate = { type: "run_result"; result: RunResult[] }

export type TypingProgressUpdate = {
  type: "progress"
  progress: TypingProgress
}

export type ClientAction<T extends ArenaType> = T extends "draw"
  ? DrawAction
  : T extends "code"
    ? CodeAction
    : T extends "typing"
      ? TypingAction
      : never

export type DrawAction = CursorUpdate | CanvasUpdate
export type CodeAction = CursorUpdate | CodeUpdate | CodeRun
export type TypingAction = TypingProgressUpdate

// ===== CLIENT MESSAGES =====

export type ClientMsg<T extends ArenaType> =
  | { type: "init"; userId: string; username: string; config?: ArenaConfig }
  | { type: "leave" }
  | ClientAction<T>

// ===== SERVER-SIDE EVENTS =====

export type ServerEvent<T extends ArenaType> = T extends "draw"
  ? DrawEvent
  : T extends "code"
    ? CodeEvent
    : T extends "typing"
      ? TypingEvent
      : never

export type DrawEvent = Attributed<CursorUpdate> | Attributed<CanvasUpdate>
export type CodeEvent =
  | Attributed<CursorUpdate>
  | Attributed<CodeUpdate>
  | Attributed<CodeRun>
  | Attributed<RunResultUpdate>

export type TypingEvent = Attributed<TypingProgressUpdate>

// ===== SERVER MESSAGES =====

export type ServerMsg<T extends ArenaType> =
  | {
      type: "state"
      participants: Participant[]
      arenaState: ArenaData<T> | null
      timeRemaining: number
    }
  | { type: "tick"; timeRemaining: number }
  | { type: "participant_joined"; participant: Participant }
  | { type: "participant_left"; participantId: string }
  | { type: "arena_over"; reason: ArenaEndReason; results: ArenaResults }
  | { type: "error"; message: string }
  | ServerEvent<T>

// ===== ARENA RESULTS =====

export type ArenaResults = {
  arenaId: string
  endReason: ArenaEndReason
  duration: number
  participants: Array<
    Participant & {
      score?: number
    }
  >
  finalData?: ArenaData<ArenaType>
}
