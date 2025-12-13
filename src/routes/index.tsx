import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useTheme } from "next-themes"
import { useState } from "react"
import { ArenaForm } from "@/components/arena-form"
import { BackgroundGrid } from "@/components/background-grid"
import {
  SchematicCanvas,
  type SchematicCanvasRef
} from "@/components/schematic-canvas"
import {
  ThemeToggleButton,
  useThemeTransition
} from "@/components/theme-toggle-button"
import { Spinner } from "@/components/ui/spinner"
import { UserProfile } from "@/components/user-profile"
import { api } from "~/convex/_generated/api"

export const Route = createFileRoute("/")({
  component: Home,
  ssr: false // website fully in SPA mode
})

function Home() {
  const [schematicState, setSchematicState] =
    useState<SchematicCanvasRef | null>(null)
  const { theme, setTheme } = useTheme()
  const { startTransition } = useThemeTransition()
  const { data: user, isLoading } = useQuery(
    convexQuery(api.users.getCurrentUser, {})
  )

  const handleThemeToggle = () => {
    startTransition(() => {
      setTheme(theme === "light" ? "dark" : "light")
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <Spinner size="lg" />
      </div>
    )
  }

  // const placeholderUser = {
  //   _id: "placeholder",
  //   username: "Guest",
  //   isAnonymous: true,
  //   email: "yo@mail.com",
  //   picture: "https://github.com/muzzlol.png"
  // }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      <BackgroundGrid />
      {/* Schematic Background */}
      <div className="absolute inset-0 z-0">
        <SchematicCanvas onStateChange={setSchematicState} />
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggleButton
          theme={theme === "dark" ? "dark" : "light"}
          onClick={handleThemeToggle}
          variant="circle-blur"
        />
      </div>

      {/* Debug Info - Bottom Left */}
      {schematicState && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-10">
          <div className="font-mono text-[10px] text-gray-500">
            Nodes: {schematicState.nodes.length} | Links:{" "}
            {schematicState.links.length} | ID: {schematicState.genId}
          </div>
        </div>
      )}

      {/* Content Overlay */}
      <main className="pointer-events-none relative z-10 flex min-h-screen w-full flex-col items-center justify-center p-4 md:p-8">
        <div className="pointer-events-auto mx-auto flex max-w-5xl flex-col items-center gap-8 border border-white/20 bg-black/60 p-8 backdrop-blur-md">
          {/* Header */}
          <div className="space-y-2 text-center">
            <h1 className="font-bold text-4xl tracking-tighter">SPECTRA</h1>
            <p className="text-xs uppercase tracking-[0.2em] opacity-70">
              - yoooo -
            </p>
          </div>
          <UserProfile user={user ?? null} />
          {user && <ArenaForm />}
        </div>
      </main>
    </div>
  )
}
