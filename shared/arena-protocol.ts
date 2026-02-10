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

export type CursorPos = { x: number; y: number; timestamp?: number }

// ===== ARENA CONFIGURATION =====

export type ArenaConfig<T extends ArenaType> = {
  arenaId: string
  type: T
  mode: ArenaMode
  prompt: string
  timeLimit: number
  hostId: string
}

// ===== ARENA DATA TYPES =====

export type ArenaDataMap = {
  draw: DrawData
  code: CodeData
  typing: TypingData
}

export type ArenaData<T extends ArenaType> = ArenaDataMap[T]

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

// ===== CLIENT MESSAGES =====

export type ClientMsg<T extends ArenaType> =
  | { type: "init"; userId: string; username: string; config?: ArenaConfig<T> }
  | { type: "leave" }
  | { type: "action"; action: ClientAction<T> }

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

export type ActionMap = {
  draw: CursorUpdate | CanvasUpdate
  code: CursorUpdate | CodeUpdate | CodeRun
  typing: TypingProgressUpdate
}

export type DrawAction = ActionMap["draw"]
export type CodeAction = ActionMap["code"]
export type TypingAction = ActionMap["typing"]

export type ClientAction<T extends ArenaType> = ActionMap[T]

// ===== SERVER MESSAGES =====

export type ServerMsg<T extends ArenaType> =
  | {
      type: "state"
      participants: Participant[]
      data: ArenaData<T> | null
      timeRemaining: number
    }
  | { type: "tick"; timeRemaining: number }
  | { type: "participant_joined"; participant: Participant }
  | { type: "participant_left"; participantId: string }
  | { type: "arena_over"; reason: ArenaEndReason; results: ArenaResults }
  | { type: "error"; message: string }
  | { type: "mechanic"; event: ArenaEvent<T> }

// ===== BROADCASTED ARENA EVENTS =====

export type ArenaEventMap = {
  draw: Attributed<CursorUpdate> | Attributed<CanvasUpdate>
  code:
    | Attributed<CursorUpdate>
    | Attributed<CodeUpdate>
    | Attributed<CodeRun>
    | Attributed<RunResultUpdate>
  typing: Attributed<TypingProgressUpdate>
}

export type ArenaEvent<T extends ArenaType> = ArenaEventMap[T]

export type DrawEvent = Attributed<CursorUpdate> | Attributed<CanvasUpdate>
export type CodeEvent =
  | Attributed<CursorUpdate>
  | Attributed<CodeUpdate>
  | Attributed<CodeRun>
  | Attributed<RunResultUpdate>

export type TypingEvent = Attributed<TypingProgressUpdate>

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

// ===== HELPER FUNCTIONS =====

export function createEmptyData<T extends ArenaType>(
  arenaType: T
): ArenaData<T> {
  switch (arenaType) {
    case "draw":
      return { playerElements: {}, playerCursors: {} } as ArenaData<T>
    case "code":
      return {
        language: "python",
        playerCode: {},
        testResults: {},
        playerCursors: {}
      } as ArenaData<T>
    case "typing":
      return { progress: {} } as ArenaData<T>
    default: {
      const _exhaustive: never = arenaType
      throw new Error(`Unknown arena type: ${_exhaustive}`)
    }
  }
}

export const removePlayerDataHelper = (
  participantId: string,
  type: ArenaType,
  data: ArenaData<ArenaType>
) => {
  switch (type) {
    case "draw": {
      const drawData = data as DrawData
      delete drawData.playerCursors[participantId]
      return drawData
    }
    case "code": {
      const codeData = data as CodeData
      delete codeData.playerCursors[participantId]
      return codeData
    }
    case "typing": {
      return data
    }
    default: {
      const _exhaustive: never = type
      throw new Error(`Unknown arena type: ${_exhaustive}`)
    }
  }
}
