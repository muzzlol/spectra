import { useAuthActions } from "@convex-dev/auth/react"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function PlayGuest() {
  const { signIn } = useAuthActions()
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleGuestJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return
    setIsLoading(true)

    try {
      await signIn("anon", { username })
    } catch (error) {
      console.error("Failed to create anon session", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm border-white/10 bg-black/40 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Welcome</CardTitle>
        <CardDescription className="text-center">
          Join as a guest or sign in to save your progress
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={handleGuestJoin} className="grid gap-4">
          <div className="grid gap-2">
            <Input
              placeholder="Enter a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border-white/10 bg-white/5"
              minLength={2}
              maxLength={20}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !username.trim()}
            variant="default"
          >
            {isLoading ? "Joining..." : "Join as Guest"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-white/10 border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button
          variant="outline"
          asChild
          className="w-full border-white/10 hover:bg-white/5"
        >
          <Link to="/auth/$pathname" params={{ pathname: "sign-in" }}>
            Sign In
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
