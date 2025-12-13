import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import { api } from "~/convex/_generated/api"

export const useCurrentUser = () => {
  const { data, isLoading } = useQuery(
    convexQuery(api.users.getCurrentUser, {})
  )

  return {
    user: data,
    isUserLoading: isLoading
  }
}
