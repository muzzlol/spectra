import { convexQuery } from "@convex-dev/react-query"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { Button } from "@/components/ui/button"
import { api } from "../../convex/_generated/api"

export const Route = createFileRoute("/")({
  component: Home
})

function Home() {
  const {
    data: { viewer, numbers }
  } = useSuspenseQuery(convexQuery(api.myFunctions.listNumbers, { count: 10 }))

  const addNumber = useMutation(api.myFunctions.addNumber)

  return (
    <main className="flex flex-col gap-16 p-8">
      <Button>Button</Button>

      <h1 className="text-center font-bold text-4xl">
        Convex + Tanstack Start
      </h1>
      <div className="mx-auto flex max-w-lg flex-col gap-8">
        <p>Welcome {viewer ?? "Anonymous"}!</p>
        <p>
          Click the button below and open this page in another window - this
          data is persisted in the Convex cloud database!
        </p>
        <p>
          <button
            type="button"
            className="rounded-md border-2 bg-dark px-4 py-2 text-light text-sm dark:bg-light dark:text-dark"
            onClick={() => {
              void addNumber({ value: Math.floor(Math.random() * 10) })
            }}
          >
            Add a random number
          </button>
        </p>
        <p>
          Numbers:{" "}
          {numbers.length === 0 ? "Click the button!" : numbers.join(", ")}
        </p>
        <p>
          Edit{" "}
          <code className="rounded-md bg-slate-200 px-1 py-0.5 font-bold font-mono text-sm dark:bg-slate-800">
            convex/myFunctions.ts
          </code>{" "}
          to change your backend
        </p>
        <p>
          Edit{" "}
          <code className="rounded-md bg-slate-200 px-1 py-0.5 font-bold font-mono text-sm dark:bg-slate-800">
            src/routes/index.tsx
          </code>{" "}
          to change your frontend
        </p>
        <p>
          Open{" "}
          <Link
            to="/anotherPage"
            className="text-blue-600 underline hover:no-underline"
          >
            another page
          </Link>{" "}
          to send an action.
        </p>
      </div>
    </main>
  )
}
