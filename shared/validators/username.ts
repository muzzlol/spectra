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
