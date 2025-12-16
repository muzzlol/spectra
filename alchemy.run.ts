import alchemy from "alchemy"
import {
  DurableObjectNamespace,
  TanStackStart,
  Worker
} from "alchemy/cloudflare"
import { GitHubComment } from "alchemy/github"
import { CloudflareStateStore } from "alchemy/state"

const app = await alchemy("spectra", {
  stateStore: (scope) => new CloudflareStateStore(scope)
})

export const arenas = await DurableObjectNamespace("ARENAS", {
  className: "ArenaWSS",
  sqlite: false
})

export const arenaHost = await Worker("AREA_HOST", {
  entrypoint: "arenas/server.ts",
  url: true,
  bindings: {
    ARENAS: arenas,
    VITE_CONVEX_URL: alchemy.secret(process.env.VITE_CONVEX_URL),
    CONVEX_SITE_URL: alchemy.secret(process.env.CONVEX_SITE_URL),
    CONVEX_SERVICE_SECRET: alchemy.secret(process.env.CONVEX_SERVICE_SECRET)
  }
})

export const website = await TanStackStart("WEBSITE", {
  name: "spectra",
  domains: ["spectra.muzzkhan.dev"],
  adopt: true,
  bindings: {
    ARENAS: arenas,
    VITE_ARENA_HOST: arenaHost.url!,
    VITE_CONVEX_URL: alchemy.secret(process.env.VITE_CONVEX_URL),
    CONVEX_SITE_URL: alchemy.secret(process.env.CONVEX_SITE_URL),
    VITE_TURNSTILE_SITE_KEY: alchemy.secret(process.env.VITE_TURNSTILE_SITE_KEY)
  }
})
console.log({ website: website.url, arenaHost: arenaHost.url })

if (process.env.PULL_REQUEST) {
  await GitHubComment("preview-comment", {
    owner: "muzzlol",
    repository: "spectra",
    issueNumber: Number(process.env.PULL_REQUEST),
    body: `## [Preview Deployed]

Your changes have been deployed to a preview environment:

**[Website]:** ${website.url}

Built from commit ${process.env.GITHUB_SHA?.slice(0, 7)}

+---
`
  })
}

await app.finalize()
