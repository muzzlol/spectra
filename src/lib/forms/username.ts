import { formOptions } from "@tanstack/form-core"
import { usernameSchema } from "~/shared/validators/username"

export const usernameFormOpts = formOptions({
  defaultValues: {
    username: ""
  },
  validators: {
    onSubmit: usernameSchema
  }
})
