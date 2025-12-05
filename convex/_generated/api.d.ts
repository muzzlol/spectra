/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as arenas from "../arenas.js";
import type * as auth from "../auth.js";
import type * as dev from "../dev.js";
import type * as env from "../env.js";
import type * as http from "../http.js";
import type * as matches from "../matches.js";
import type * as schema_arena from "../schema/arena.js";
import type * as schema_match from "../schema/match.js";
import type * as schema_user from "../schema/user.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  arenas: typeof arenas;
  auth: typeof auth;
  dev: typeof dev;
  env: typeof env;
  http: typeof http;
  matches: typeof matches;
  "schema/arena": typeof schema_arena;
  "schema/match": typeof schema_match;
  "schema/user": typeof schema_user;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
