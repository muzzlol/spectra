import { useAuthActions } from "@convex-dev/auth/react"
import { formOptions, useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { z } from "zod"
import { GithubIcon, GoogleIcon } from "@/components/brand-icons"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { usernameFormOpts } from "@/lib/forms/username"

export const emailSchema = z.object({
  email: z.email({
    error: "Invalid email address"
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

export function AuthCard({ session }) {
  const { signIn } = useAuthActions()
  const usernameForm = useForm(usernameFormOpts)
  const emailForm = useForm(emailFormOpts)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register Account</CardTitle>
      </CardHeader>
    </Card>
  )
}
