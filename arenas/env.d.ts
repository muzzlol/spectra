import type { arenaHost } from "~/alchemy.run"

export type WorkerEnv = typeof arenaHost.Env

declare module "cloudflare:workers" {
  namespace Cloudflare {
    interface Env extends WorkerEnv {}
  }
}
