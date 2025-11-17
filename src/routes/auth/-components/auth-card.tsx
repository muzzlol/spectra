import { useAuthActions } from "@convex-dev/auth/react"
import { formOptions, useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { motion } from "motion/react"
import { toast } from "sonner"
import { z } from "zod"
import { GithubIcon } from "@/components/brand-icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

export const emailSchema = z.object({
  email: z.email({
    error: "Please enter a valid email address"
  })
})

export const emailFormOpts = formOptions({
  defaultValues: {
    email: ""
  },
  validators: {
    onSubmit: emailSchema
  }
})

export function AuthCard() {
  const { signIn } = useAuthActions()
  const emailForm = useForm(emailFormOpts)

  const emailSignInMutation = useMutation({
    mutationFn: async (values: { email: string }) => {
      await signIn("resend", { email: values.email })
    },
    onSuccess: () => {
      toast.success("Check your email for a magic link!")
    },
    onError: (error) => {
      toast.error("Failed to send email")
      console.error(error)
    }
  })

  emailForm.options.onSubmit = async ({ value }) => {
    await emailSignInMutation.mutateAsync(value)
  }

  const githubSignInMutation = useMutation({
    mutationFn: async () => {
      await signIn("github")
    },
    onError: (error) => {
      toast.error("Failed to sign in with GitHub")
      console.error(error)
    }
  })

  return (
    <Card className="w-full max-w-md bg-secondary-background">
      <CardHeader className="border-b">
        <CardTitle className="text-center text-2xl">Sign In</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button
            variant="neutral"
            className="w-full"
            onClick={() => githubSignInMutation.mutate()}
            disabled={githubSignInMutation.isPending}
          >
            {githubSignInMutation.isPending ? (
              <Spinner size="sm" />
            ) : (
              <GithubIcon className="size-5 shrink-0" />
            )}
            Continue with GitHub
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <FieldSeparator>Or continue with email</FieldSeparator>
        </motion.div>

        <form
          onSubmit={async (e) => {
            e.preventDefault()
            e.stopPropagation()
            await emailForm.handleSubmit()
            emailForm.reset()
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <emailForm.Field name="email">
              {(field) => (
                <Field>
                  <Input
                    type="email"
                    placeholder="hello@example.com"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </emailForm.Field>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="mt-2 text-center text-muted-foreground text-sm"
          >
            We'll send you a magic link to sign in.
          </motion.div>
          <motion.div
            className="mt-4 w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Button
              type="submit"
              className="w-full"
              disabled={emailSignInMutation.isPending}
            >
              {emailSignInMutation.isPending && <Spinner size="sm" />}
              {emailSignInMutation.isPending
                ? "Sending..."
                : "Continue with Email"}
            </Button>
          </motion.div>
        </form>
      </CardContent>
    </Card>
  )
}
