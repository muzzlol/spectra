import alchemy from "alchemy"
import { DurableObjectNamespace, TanStackStart } from "alchemy/cloudflare"

const app = await alchemy("spectra")

export const arenas = await DurableObjectNamespace("ARENAS", {
  className: "ArenaWSS",
  environment: "prod"
})

export const worker = await TanStackStart("WORKER", {
  name: "spectra",
  domains: ["spectra.muzzkhan.dev"],
  adopt: true,
  bindings: {
    ARENAS: arenas.id
  }
})
console.log({
  url: worker.url
})

await app.finalize()
