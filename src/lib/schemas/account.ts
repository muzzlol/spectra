import { formOptions } from "@tanstack/form-core"
import { z } from "zod"

export const usernameSchema = z.object({
  username: z
    .string()
    .min(3, {
      message: "Username must be at least 3 characters"
    })
    .max(15, {
      message: "Username must be at most 15 characters"
    })
    .regex(/^[a-zA-Z0-9]+$/, {
      message: "Username must contain only letters and numbers"
    })
})

export const emailSchema = z.object({
  email: z.email({
    message: "Invalid email address"
  })
})

export const usernameFormOpts = formOptions({
  defaultValues: {
    username: ""
  },
  validators: {
    onSubmit: usernameSchema
  }
})

export const emailFormOpts = formOptions({
  defaultValues: {
    email: ""
  },
  validators: {
    onSubmit: emailSchema
  }
})
