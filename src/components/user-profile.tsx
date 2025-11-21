import { Link } from "@tanstack/react-router"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlayGuest } from "./play-guest"

interface UserStats {
  wins: number
  played: number
}
interface UserProfileProps {
  user: {
    username?: string
    isAnonymous: boolean
    email?: string
    picture?: string
    stats?: {
      draw: UserStats
      code: UserStats
      typing: UserStats
    }
  } | null
}

export function UserProfile({ user }: UserProfileProps) {
  if (!user) {
    return <PlayGuest />
  }
  const { username, isAnonymous, picture, email, stats } = user

  return (
    <div className="relative w-full max-w-md">
      <Card className="w-full border-white/10 bg-black/40 backdrop-blur-xl transition-all duration-500">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-white/10">
            <AvatarImage src={picture} alt={username} />
            <AvatarFallback className="bg-white/10 text-lg">
              {username?.[0]?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col">
            <CardTitle className="flex items-center gap-2 text-xl">
              {username}
              {isAnonymous && (
                <span className="rounded bg-white/10 px-2 py-0.5 font-normal text-muted-foreground text-xs">
                  Guest
                </span>
              )}
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              {email ?? "Anonymous User"}
            </p>
          </div>
          {isAnonymous && (
            <Button asChild variant="outline" size="sm" className="ml-auto">
              <Link to="/auth/$pathname" params={{ pathname: "sign-in" }}>
                Sign In
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs uppercase tracking-wider">
                Draw
              </span>
              <span className="font-bold font-mono text-lg">
                {stats?.draw?.wins ?? 0}
                <span className="text-muted-foreground/50 text-sm">/</span>
                {stats?.draw?.played ?? 0}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs uppercase tracking-wider">
                Code
              </span>
              <span className="font-bold font-mono text-lg">
                {stats?.code?.wins ?? 0}
                <span className="text-muted-foreground/50 text-sm">/</span>
                {stats?.code?.played ?? 0}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs uppercase tracking-wider">
                Type
              </span>
              <span className="font-bold font-mono text-lg">
                {stats?.typing?.wins ?? 0}
                <span className="text-muted-foreground/50 text-sm">/</span>
                {stats?.typing?.played ?? 0}
              </span>
            </div>
          </div>
          {isAnonymous && (
            <div className="mt-4 rounded-md bg-white/5 p-3 text-center text-muted-foreground text-xs">
              Sign in to save your stats permanently and appear on leaderboards.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
