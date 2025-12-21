import type { ReactNode } from "react"

interface PaneGridProps {
  paneCount: number
  children: (index: number) => ReactNode
}

/**
 * Responsive grid layout that splits by player count.
 * - 1 player: full screen (no grid)
 * - 2 players: 2 columns
 * - 3 players: 2 columns (2 top, 1 bottom centered)
 * - 4 players: 2x2 grid
 */
export function PaneGrid({ paneCount, children }: PaneGridProps) {
  if (paneCount === 1) {
    return <div className="h-full w-full">{children(0)}</div>
  }

  if (paneCount === 2) {
    return (
      <div className="grid h-full w-full grid-cols-2 gap-2">
        <div className="h-full">{children(0)}</div>
        <div className="h-full">{children(1)}</div>
      </div>
    )
  }

  if (paneCount === 3) {
    return (
      <div className="grid h-full w-full grid-rows-2 gap-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="h-full">{children(0)}</div>
          <div className="h-full">{children(1)}</div>
        </div>
        <div className="flex justify-center">
          <div className="h-full w-1/2">{children(2)}</div>
        </div>
      </div>
    )
  }

  if (paneCount === 4) {
    return (
      <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-2">
        <div className="h-full">{children(0)}</div>
        <div className="h-full">{children(1)}</div>
        <div className="h-full">{children(2)}</div>
        <div className="h-full">{children(3)}</div>
      </div>
    )
  }

  // fallback for larger counts - basically equivalent to 1, 2, 4 grid
  return (
    <div
      className="grid h-full w-full gap-2"
      style={{
        gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(paneCount))}, 1fr)`,
        gridTemplateRows: `repeat(${Math.ceil(paneCount / Math.ceil(Math.sqrt(paneCount)))}, 1fr)`
      }}
    >
      {Array.from({ length: paneCount }, (_, i) => (
        <div key={i} className="h-full">
          {children(i)}
        </div>
      ))}
    </div>
  )
}
