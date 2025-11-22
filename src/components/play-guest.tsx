import { useAuthActions } from "@convex-dev/auth/react"
import { useForm } from "@tanstack/react-form"
import { Link } from "@tanstack/react-router"
import { useConvex } from "convex/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Field, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { api } from "~/convex/_generated/api"
import { usernameSchema } from "~/shared/validators/username"

export function PlayGuest() {
  const { signIn } = useAuthActions()
  const convex = useConvex()

  const form = useForm({
    defaultValues: {
      username: ""
    },
    onSubmit: async ({ value }) => {
      await signIn("anon", { username: value.username })
    }
  })

  return (
    <Card className="w-full max-w-sm bg-secondary-background/80 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Welcome</CardTitle>
        <CardDescription className="text-center">
          Join as a guest or sign in to save your progress
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="grid gap-4"
        >
          <form.Field
            name="username"
            validators={{
              onChange: ({ value }) => {
                const result = usernameSchema.shape.username.safeParse(value)
                if (!result.success) {
                  return { message: result.error.issues[0].message }
                }
                return undefined
              },
              onChangeAsyncDebounceMs: 400,
              onChangeAsync: async ({ value }) => {
                if (!value) return undefined
                try {
                  const isAvailable = await convex.query(
                    api.users.isUsernameAvailable,
                    {
                      username: value
                    }
                  )
                  if (!isAvailable) {
                    return { message: "Username is already taken" }
                  }
                } catch (error) {
                  console.error(error)
                  return { message: "Error checking availability" }
                }
                return undefined
              }
            }}
          >
            {(field) => (
              <Field>
                <Input
                  placeholder="Enter a username"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="border-border bg-background"
                />
                {field.state.meta.isValidating ? (
                  <div className="text-muted text-xs">
                    Checking availability...
                  </div>
                ) : (
                  <FieldError
                    className="text-destructive text-xs"
                    errors={field.state.meta.errors}
                  />
                )}
              </Field>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit} variant="default">
                {isSubmitting ? "Joining..." : "Join as Guest"}
              </Button>
            )}
          </form.Subscribe>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-border border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button
          variant="outline"
          asChild
          className="w-full border-border hover:bg-muted"
        >
          <Link to="/auth/$pathname" params={{ pathname: "sign-in" }}>
            Sign In
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
