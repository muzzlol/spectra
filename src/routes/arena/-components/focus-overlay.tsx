import { X } from "lucide-react"
import { type ReactNode, useCallback, useEffect } from "react"
import { createPortal } from "react-dom"

interface FocusOverlayProps {
  isOpen: boolean
  onClose: () => void
  ownerUsername?: string
  isOwner?: boolean
  children: ReactNode
}

export function FocusOverlay({
  isOpen,
  onClose,
  ownerUsername,
  isOwner = false,
  children
}: FocusOverlayProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleEscape)
      // Prevent body scroll when overlay is open
      document.body.style.overflow = "hidden"
    }
    return () => {
      window.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative flex h-[90vh] w-[90vw] flex-col overflow-hidden rounded-lg border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-border border-b px-4 py-2">
          <div className="flex items-center gap-3">
            {ownerUsername && (
              <span className="font-medium text-sm">{ownerUsername}</span>
            )}
            {!isOwner && (
              <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground text-xs">
                View only
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>,
    document.body
  )
}

