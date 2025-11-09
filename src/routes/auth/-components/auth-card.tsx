import { useAuthActions } from "@convex-dev/auth/react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { emailFormOpts, usernameFormOpts } from "@/lib/schemas/account"

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
