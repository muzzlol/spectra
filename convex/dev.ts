import type { TableNames } from "./_generated/dataModel"
import { mutation } from "./_generated/server"

export const clearAllTables = mutation({
  handler: async (ctx) => {
    const tables = [
      "authAccounts",
      "authRateLimits",
      "authRefreshTokens",
      "authSessions",
      "authVerificationCodes",
      "authVerifiers",
      "users",
      "numbers"
    ] as const

    // type Tables = (typeof tables)[number]

    // type IsExact = Tables extends TableNames
    //   ? TableNames extends Tables
    //     ? true
    //     : false
    //   : false

    // type Check = IsExact
    for (const tableName of tables) {
      const docs = await ctx.db.query(tableName as TableNames).collect()
      for (const doc of docs) {
        await ctx.db.delete(doc._id)
      }
    }

    return { clearedTables: tables, message: "All data cleared" }
  }
})
