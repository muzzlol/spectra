import { PlayGuest } from "@/components/play-guest"

export function GuestOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <PlayGuest />
    </div>
  )
}
