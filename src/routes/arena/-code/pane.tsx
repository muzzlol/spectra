import { CheckCircle, Expand, XCircle } from "lucide-react"
import type { CursorData } from "../-hooks/use-arena-socket"

/** Test case result status */
export type TestResult = {
  passed: boolean
  name: string
  time?: number
}

interface CodePaneProps {
  paneId: string
  ownerId: string
  ownerUsername: string
  isEditable: boolean
  code: string
  testResults?: TestResult[]
  cursor?: CursorData
  onCodeChange?: (code: string) => void
  onCursorMove?: (line: number, column: number) => void
  onFocus?: () => void
}

export function CodePane({
  ownerUsername,
  isEditable,
  code,
  testResults = [],
  onFocus
}: CodePaneProps) {
  const passedCount = testResults.filter((r) => r.passed).length
  const totalCount = testResults.length

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
          <pre className="flex-1 overflow-auto p-3 font-mono text-sm">
            {code || "// Start coding..."}
          </pre>
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
                {result.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
