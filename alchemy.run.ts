import alchemy from "alchemy"
import { DurableObjectNamespace, TanStackStart } from "alchemy/cloudflare"

const app = await alchemy("spectra")

export const gameRooms = await DurableObjectNamespace("GAME-ROOMS", {
  className: "GameRoom",
  environment: "prod"
})

export const worker = await TanStackStart("WORKER", {
  name: "spectra",
  domains: ["spectra.muzzkhan.dev"],
  adopt: true,
  entrypoint: "game-rooms/server.ts",
  bindings: {
    GAME_SERVER: gameRooms.id
  }
})
console.log({
  url: worker.url
})

await app.finalize()
