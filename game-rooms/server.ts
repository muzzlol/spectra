import { DurableObject } from "cloudflare:workers"
import type { WorkerEnv } from "./env"
export default class GameRoom extends DurableObject {
  declare env: WorkerEnv
  #count = 0
  constructor(ctx: DurableObjectState, env: WorkerEnv) {
    super(ctx, env)
    this.#count = 1
  }
  async fetch(request: Request) {
    return new Response("Hello, world!")
  }
}
