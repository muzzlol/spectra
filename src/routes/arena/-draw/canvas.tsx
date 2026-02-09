import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types"
import { Expand } from "lucide-react"
import type { CursorPos } from "~/shared/arena-protocol"

type CanvasCursor = CursorPos & { participantId: string }

interface DrawCanvasProps {
  paneId: string
  ownerId: string
  ownerUsername: string
  isEditable: boolean
  elements: ExcalidrawElement[]
  cursors: CanvasCursor[]
  onElementsChange?: (elements: ExcalidrawElement[]) => void
  onCursorMove?: (x: number, y: number) => void
  onFocus?: () => void
}

export function DrawCanvas({
  ownerUsername,
  isEditable,
  elements,
  cursors,
  onFocus
}: DrawCanvasProps) {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-md border border-border bg-background">
      {/* Pane header */}
      <div className="flex items-center justify-between border-border border-b bg-muted/30 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{ownerUsername}</span>
          {isEditable ? (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary text-xs">
              You
            </span>
          ) : (
            <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
              View only
            </span>
          )}
        </div>
        {onFocus && (
          <button
            type="button"
            onClick={onFocus}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Expand"
          >
            <Expand className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Canvas area - Excalidraw will mount here */}
      <div className="relative flex-1">
        {/* Placeholder until Excalidraw is integrated */}
        <div className="flex h-full w-full items-center justify-center bg-muted/10">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Excalidraw canvas</p>
            <p className="mt-1 text-xs">
              {isEditable ? "Draw here" : `Watching ${ownerUsername}`}
            </p>
            <p className="mt-2 text-xs">
              {elements.length} element(s), {cursors.length} cursor(s)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
