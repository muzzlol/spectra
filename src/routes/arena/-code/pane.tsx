import { CheckCircle, Expand, XCircle } from "lucide-react"
import type { CursorPos } from "~/shared/arena-protocol"

/** Test case result status */
export type TestResult = {
  passed: boolean
  name?: string
  output?: string
  time?: number
}

interface CodePaneProps {
  paneId: string
  ownerId: string
  ownerUsername: string
  isEditable: boolean
  code: string
  testResults?: TestResult[]
  cursor?: CursorPos
  onCodeChange?: (code: string) => void
  onCursorMove?: (line: number, column: number) => void
  onFocus?: () => void
}

export function CodePane({
  ownerUsername,
  isEditable,
  code,
  testResults = [],
  cursor,
  onCodeChange,
  onCursorMove,
  onFocus
}: CodePaneProps) {
  const passedCount = testResults.filter((r) => r.passed).length
  const totalCount = testResults.length

  const emitCursor = (value: string, caretIndex: number) => {
    if (!onCursorMove) return

    const safeCaret = Math.max(0, caretIndex)
    const prefix = value.slice(0, safeCaret)
    const lines = prefix.split("\n")
    const line = lines.length
    const column = (lines.at(-1)?.length ?? 0) + 1
    onCursorMove(line, column)
  }

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
        <div className="flex items-center gap-2">
          {/* Test results summary */}
          {totalCount > 0 && (
            <span
              className={`flex items-center gap-1 text-xs ${
                passedCount === totalCount
                  ? "text-green-500"
                  : "text-muted-foreground"
              }`}
            >
              {passedCount === totalCount ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              {passedCount}/{totalCount}
            </span>
          )}
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
      </div>

      {/* Editor area - Code editor will mount here */}
      <div className="relative flex-1 overflow-auto">
        {/* Placeholder until code editor is integrated */}
        <div className="flex h-full w-full flex-col bg-muted/10">
          {isEditable ? (
            <textarea
              value={code}
              onChange={(event) => {
                onCodeChange?.(event.target.value)
                emitCursor(event.target.value, event.target.selectionStart ?? 0)
              }}
              onClick={(event) => {
                emitCursor(
                  event.currentTarget.value,
                  event.currentTarget.selectionStart ?? 0
                )
              }}
              onKeyUp={(event) => {
                emitCursor(
                  event.currentTarget.value,
                  event.currentTarget.selectionStart ?? 0
                )
              }}
              placeholder="// Start coding..."
              spellCheck={false}
              className="h-full w-full resize-none bg-transparent p-3 font-mono text-sm outline-none"
            />
          ) : (
            <pre className="flex-1 overflow-auto p-3 font-mono text-sm">
              {code || "// Waiting for code..."}
            </pre>
          )}
          {!isEditable && cursor && (
            <div className="shrink-0 border-border border-t px-3 py-1 font-mono text-muted-foreground text-xs">
              Cursor: L{Math.round(cursor.x)} C{Math.round(cursor.y)}
            </div>
          )}
        </div>
      </div>

      {/* Test results panel (collapsed) */}
      {testResults.length > 0 && (
        <div className="shrink-0 border-border border-t bg-muted/20 px-3 py-2">
          <div className="flex flex-wrap gap-2">
            {testResults.map((result, i) => (
              <span
                key={i}
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs ${
                  result.passed
                    ? "bg-green-500/10 text-green-500"
                    : "bg-red-500/10 text-red-500"
                }`}
              >
                {result.passed ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {result.name ?? `Test ${i + 1}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
