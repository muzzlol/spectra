export type ArenaType = "draw" | "code" | "typing"
export type ArenaMode = "solo" | "pvp" | "duo"

export const TYPE_CONFIG: Record<
  ArenaType,
  { label: Capitalize<ArenaType>; showTimer: boolean }
> = {
  draw: { label: "Draw", showTimer: true },
  code: { label: "Code", showTimer: false },
  typing: { label: "Typing", showTimer: true }
}

export const MODE_CONFIG: Record<
  ArenaMode,
  {
    label: Capitalize<ArenaMode> | string
    maxPlayers: number
    minPlayers: number
    showPlayerInput: boolean
  }
> = {
  solo: { label: "Solo", maxPlayers: 1, minPlayers: 1, showPlayerInput: false },
  pvp: { label: "PvP", maxPlayers: 4, minPlayers: 2, showPlayerInput: true },
  duo: {
    label: "Duo (2v2)",
    maxPlayers: 4,
    minPlayers: 4,
    showPlayerInput: false
  }
}
