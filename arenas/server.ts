import { DurableObject } from "cloudflare:workers"
import { request } from "http"
import type { WorkerEnv } from "./env"
export default class ArenaWSS extends DurableObject {
  declare env: WorkerEnv
  #count = 0
  constructor(ctx: DurableObjectState, env: WorkerEnv) {
    super(ctx, env)
    this.#count = 1
  }
  async fetch(request: Request) {}
}
