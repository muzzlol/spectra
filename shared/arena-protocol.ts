import type { ArenaMode, ArenaType } from "~/convex/schema/arena"

export type ArenaConfig = {
  arenaId: string
  type: ArenaType
  mode: ArenaMode
  prompt: string
  timeLimit: number
  hostId: string
}
export type ClientMsg =
  | { type: "init"; userId: string; username: string; config?: ArenaConfig }
  | { type: "element_change"; elements: unknown[] }
  | { type: "cursor"; x: number; y: number }
  | { type: "leave" }

export type ServerMsg =
  | { type: "connected"; participantId: string }
  | {
      type: "state"
      participants: Participant[]
      elements: unknown[]
      timeRemaining: number
    }
  | { type: "participant_joined"; participant: Participant }
  | { type: "participant_left"; participantId: string }
  | { type: "element_change"; elements: unknown[]; from: string }
  | { type: "cursor"; participantId: string; x: number; y: number }
  | { type: "game_over"; reason: GameEndReason; results: GameResults }
  | { type: "error"; message: string }

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
    Pick<Participant, "id" | "username"> & {
      score?: number
    }
  >
  finalElements?: unknown[]
}
