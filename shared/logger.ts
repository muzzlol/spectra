type LogLvl = "info" | "warn" | "error"

interface LogPayload {
  message: string
  [key: string]: unknown
}

const log = (lvl: LogLvl, payload: LogPayload) => {
  const entry = {
    timestamp: new Date().toISOString(),
    lvl,
    payload
  }

  console[lvl](JSON.stringify(entry, null, 2))
}

export default {
  info: (payload: LogPayload) => log("info", payload),
  warn: (payload: LogPayload) => log("warn", payload),
  error: (payload: LogPayload) => log("error", payload)
}
