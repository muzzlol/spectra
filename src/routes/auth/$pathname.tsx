import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthCard } from "./-components/auth-card"
export const Route = createFileRoute("/auth/$pathname")({
  component: RouteComponent
})

function RouteComponent() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 p-4 sm:p-8">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <Link to="/">
          <Button variant="default" size="sm" className="gap-2">
            <ArrowLeftIcon className="size-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </Link>
      </div>
      {/* replace with logo/name */}
      <h1 className="text-center font-bold text-4xl">Spectra</h1>
      <div className="w-full max-w-sm sm:max-w-sm lg:max-w-md">
        <AuthCard />
      </div>
    </main>
  )
}
