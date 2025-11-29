import alchemy from "alchemy"
import { TanStackStart } from "alchemy/cloudflare"

const app = await alchemy("spectra")

export const worker = await TanStackStart("worker", {
  name: "spectra",
  domains: ["spectra.muzzkhan.dev"],
  adopt: true
})

console.log({
  url: worker.url
})

await app.finalize()
