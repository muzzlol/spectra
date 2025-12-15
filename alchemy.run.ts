import alchemy from "alchemy"
import { DurableObjectNamespace, TanStackStart } from "alchemy/cloudflare"
import { GitHubComment } from "alchemy/github"
import { CloudflareStateStore } from "alchemy/state"

const app = await alchemy("spectra", {
  stateStore: (scope) => new CloudflareStateStore(scope)
})

export const arenas = await DurableObjectNamespace("ARENAS", {
  className: "ArenaWSS",
  sqlite: false
})

export const worker = await TanStackStart("WORKER", {
  name: "spectra",
  domains: ["spectra.muzzkhan.dev"],
  adopt: true,
  bindings: {
    ARENAS: arenas,
    VITE_CONVEX_URL: alchemy.secret(process.env.VITE_CONVEX_URL),
    CONVEX_SITE_URL: alchemy.secret(process.env.CONVEX_SITE_URL),
    VITE_TURNSTILE_SITE_KEY: alchemy.secret(process.env.VITE_TURNSTILE_SITE_KEY)
  }
})
console.log({ url: worker.url })

if (process.env.PULL_REQUEST) {
  await GitHubComment("preview-comment", {
    owner: "muzzlol",
    repository: "spectra",
    issueNumber: Number(process.env.PULL_REQUEST),
    body: `## [Preview Deployed]

Your changes have been deployed to a preview environment:

**[Website]:** ${worker.url}

Built from commit ${process.env.GITHUB_SHA?.slice(0, 7)}

+---
`
  })
}

await app.finalize()
