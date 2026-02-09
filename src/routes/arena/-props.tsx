import type { ArenaType } from "~/convex/schema/arena"
import type {
  ArenaData,
  ArenaEvent,
  ClientAction,
  Participant
} from "~/shared/arena-protocol"
import type { EventBridge } from "./-event-bridge"

export type ArenaComponentProps<T extends ArenaType> = {
  userId: string
  participants: Participant[]
  isSpectator: boolean
  prompt: string
  data: ArenaData<T> | null
  sendAction: (action: ClientAction<T>) => void
  eventBridge: EventBridge<ArenaEvent<T>>
}
