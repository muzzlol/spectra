export type EventBridge<T> = {
  emit: (event: T) => void
  sub: (listener: (event: T) => void) => void
  unsub: () => void
}
export function createEventBridge<T>(): EventBridge<T> {
  let listener: ((event: T) => void) | null = null
  const q: T[] = []
  return {
    emit: (event: T) => {
      if (listener) {
        listener(event)
        return
      }
      // if no listener, queue the event
      q.push(event)
    },
    sub: (fn: (event: T) => void) => {
      listener = fn
      q.forEach(fn)
      q.length = 0
    },
    unsub: () => {
      listener = null
      q.length = 0
    }
  }
}
