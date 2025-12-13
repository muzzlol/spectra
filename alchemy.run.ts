import alchemy from "alchemy"
import { DurableObjectNamespace, TanStackStart } from "alchemy/cloudflare"
import { GitHubComment } from "alchemy/github"
import { CloudflareStateStore } from "alchemy/state"

const app = await alchemy("spectra", {
  stateStore: (scope) => new CloudflareStateStore(scope)
})

// export const arenas = await DurableObjectNamespace("ARENAS", {
// className: "ArenaWSS",
// environment: "prod"
// })

export const worker = await TanStackStart("WORKER", {
  name: "spectra",
  domains: ["spectra.muzzkhan.dev"],
  adopt: true
  // bindings: {
  //   ARENAS: arenas.id
  // }
})

console.log({
  url: worker.url
})

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
