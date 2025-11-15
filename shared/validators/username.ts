import { z } from "zod"

export const usernameSchema = z.object({
  username: z
    .string()
    .min(3, {
      error: "Username must be at least 3 characters"
    })
    .max(15, {
      error: "Username must be at most 15 characters"
    })
    .regex(/^[a-zA-Z0-9]+$/, {
      error: "Username must contain only letters and numbers"
    })
})
