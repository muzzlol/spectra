import { useForm, useStore } from "@tanstack/react-form"
import { useConvex, useMutation } from "convex/react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { api } from "~/convex/_generated/api"
import type { Id } from "~/convex/_generated/dataModel"

import {
  type ArenaMode,
  type ArenaType,
  MODE_CONFIG,
  TYPE_CONFIG
} from "~/shared/schema/arena"

const ARENA_TYPES: { value: ArenaType; label: Capitalize<ArenaType> }[] =
  Object.entries(TYPE_CONFIG).map(([value, { label }]) => ({
    value: value as ArenaType,
    label
  }))

const ARENA_MODES: {
  value: ArenaMode
  label: Capitalize<ArenaMode> | string
  maxPlayers: number
  minPlayers: number
  showPlayerInput: boolean
}[] = Object.entries(MODE_CONFIG).map(
  ([value, { label, maxPlayers, minPlayers, showPlayerInput }]) => ({
    value: value as ArenaMode,
    label,
    maxPlayers,
    minPlayers,
    showPlayerInput
  })
)

const DFT_TIME_LIMIT = 300

type Tab = "create" | "join"
type PromptValue =
  | { type: "draw"; imageFile?: File; imageUrl?: string }
  | { type: "code"; text: string }
  | { type: "typing"; text: string }

interface PromptInputProps {
  arenaType: ArenaType
  value: PromptValue
  onChange: (value: PromptValue) => void
}

// shared select styles
const selectStyles = cn(
  "flex h-10 w-full rounded-none border-input border-b bg-transparent px-3 py-2 text-sm",
  "ring-offset-background focus-visible:border-foreground focus-visible:outline-none",
  "font-mono disabled:cursor-not-allowed disabled:opacity-50"
)

function PromptInput({
  arenaType: ArenaType,
  value,
  onChange
}: PromptInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [inputMode, setInputMode] = useState<"file" | "url">("file")

  if (ArenaType === "draw") {
    const drawValue = value.type === "draw" ? value : { type: "draw" as const }

    return (
      <Field>
        <FieldLabel>Reference Image</FieldLabel>
        <div className="mb-2 flex gap-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === "file"}
            onClick={() => setInputMode("file")}
            className={cn(
              "border-b-2 px-2 py-1 text-xs transition-colors",
              inputMode === "file"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Upload
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === "url"}
            onClick={() => setInputMode("url")}
            className={cn(
              "border-b-2 px-2 py-1 text-xs transition-colors",
              inputMode === "url"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            URL
          </button>
        </div>

        {inputMode === "file" ? (
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file && file.size > 10 * 1024 * 1024) {
                  toast.error("Image must be less than 10MB")
                  return
                }
                onChange({ type: "draw", imageFile: file, imageUrl: undefined })
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "h-20 w-full rounded-none border border-input border-dashed",
                "flex items-center justify-center text-muted-foreground text-sm",
                "transition-colors hover:border-foreground hover:text-foreground"
              )}
            >
              {drawValue.imageFile ? (
                <span className="truncate px-2">
                  {drawValue.imageFile.name}
                </span>
              ) : (
                "Click to upload image"
              )}
            </button>
          </div>
        ) : (
          <Input
            type="url"
            placeholder="https://example.com/image.png"
            value={drawValue.imageUrl || ""}
            onChange={(e) =>
              onChange({
                type: "draw",
                imageUrl: e.target.value,
                imageFile: undefined
              })
            }
            className="border-border bg-background"
          />
        )}
      </Field>
    )
  }

  // Code and Typing: placeholder for now
  const textValue =
    value.type === ArenaType && "text" in value ? value.text : ""

  return (
    <Field>
      <FieldLabel>
        {ArenaType === "code" ? "Challenge" : "Text Prompt"}
      </FieldLabel>
      <Input
        placeholder={ArenaType === "code" ? "Coming soon..." : "Coming soon..."}
        value={textValue}
        onChange={(e) =>
          onChange({ type: ArenaType, text: e.target.value } as PromptValue)
        }
        disabled
        className="border-border bg-background"
      />
      <p className="text-muted-foreground text-xs">
        {ArenaType === "code" ? "Code challenges" : "Typing tests"} coming soon
      </p>
    </Field>
  )
}

function CreateArenaForm() {
  const createArena = useMutation(api.arenas.create)
  const [promptValue, setPromptValue] = useState<PromptValue>({ type: "draw" })

  const form = useForm({
    defaultValues: {
      type: "draw" as ArenaType,
      mode: "pvp" as ArenaMode,
      maxPlayers: MODE_CONFIG.pvp.maxPlayers,
      timeLimit: DFT_TIME_LIMIT
    },
    onSubmit: async ({ value }) => {
      try {
        // Convert prompt value to string for now (will need backend changes for file upload)
        let prompt = ""
        if (promptValue.type === "draw") {
          prompt = promptValue.imageUrl || promptValue.imageFile?.name || ""
        } else if ("text" in promptValue) {
          prompt = promptValue.text
        }

        const arenaId = await createArena({
          type: value.type,
          mode: value.mode,
          maxPlayers: value.maxPlayers,
          timeLimit: value.timeLimit,
          prompt
        })
        toast.success("Arena created!")
        console.log("Created arena:", arenaId)
        // TODO: Navigate to arena or connect to DO
      } catch (error) {
        toast.error("Failed to create arena")
        console.error(error)
      }
    }
  })

  const currentType = useStore(form.store, (state) => state.values.type)
  const currentMode = useStore(form.store, (state) => state.values.mode)

  const typeConfig = TYPE_CONFIG[currentType]
  const modeConfig = MODE_CONFIG[currentMode]

  const playerCounts = modeConfig.showPlayerInput
    ? Array.from(
        { length: modeConfig.maxPlayers - modeConfig.minPlayers + 1 },
        (_, i) => i + modeConfig.minPlayers
      )
    : []

  const rowLayout =
    modeConfig.showPlayerInput && typeConfig.showTimer
      ? "grid-cols-2"
      : "grid-cols-1"

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
      className="grid gap-3"
    >
      {/* Type & Mode row */}
      <div className="grid grid-cols-2 gap-3">
        <form.Field name="type">
          {(field) => (
            <Field>
              <FieldLabel className="text-xs">Type</FieldLabel>
              <select
                value={field.state.value}
                onChange={(e) => {
                  const newType = e.target.value as ArenaType
                  field.handleChange(newType)
                  setPromptValue({ type: newType } as PromptValue)
                  if (newType === "code") {
                    form.setFieldValue("timeLimit", 0)
                  }
                  if (newType !== "code" && form.state.values.timeLimit === 0) {
                    form.setFieldValue("timeLimit", DFT_TIME_LIMIT)
                  }
                }}
                className={selectStyles}
              >
                {ARENA_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </form.Field>

        <form.Field
          name="mode"
          listeners={{
            onChange: ({ value }) => {
              const newMode = MODE_CONFIG[value]
              if (newMode) {
                form.setFieldValue("maxPlayers", newMode.maxPlayers)
              }
            }
          }}
        >
          {(field) => (
            <Field>
              <FieldLabel className="text-xs">Mode</FieldLabel>
              <select
                value={field.state.value}
                onChange={(e) =>
                  field.handleChange(e.target.value as ArenaMode)
                }
                className={selectStyles}
              >
                {ARENA_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </form.Field>
      </div>

      {/* Players & Time row */}
      <div className={cn("grid gap-3", rowLayout)}>
        {modeConfig.showPlayerInput && (
          <form.Field name="maxPlayers">
            {(field) => (
              <Field>
                <FieldLabel className="text-xs">Players</FieldLabel>
                <select
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  className={selectStyles}
                >
                  {playerCounts.map((count) => (
                    <option key={count} value={count}>
                      {count} player{count > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </form.Field>
        )}

        {typeConfig.showTimer && (
          <form.Field name="timeLimit">
            {(field) => (
              <Field>
                <FieldLabel className="text-xs">Time (sec)</FieldLabel>
                <Input
                  type="number"
                  min={60}
                  max={3600}
                  step={60}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  className="border-border bg-background"
                />
              </Field>
            )}
          </form.Field>
        )}
      </div>

      {/* Prompt input */}
      <PromptInput
        arenaType={currentType}
        value={promptValue}
        onChange={setPromptValue}
      />

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!canSubmit}>
            {isSubmitting ? "Creating..." : "Create Arena"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}

function JoinArenaForm() {
  const convex = useConvex()
  const [validArenaId, setValidArenaId] = useState<Id<"arenas"> | null>(null)

  const form = useForm({
    defaultValues: {
      arenaId: ""
    },
    onSubmit: async ({ value }) => {
      if (!validArenaId) return
      try {
        toast.success("Joining arena...")
        console.log("Joining arena:", value.arenaId)
        // TODO: Call join mutation and connect to DO
      } catch (error) {
        toast.error("Failed to join arena")
        console.error(error)
      }
    }
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
      className="grid gap-4"
    >
      <form.Field
        name="arenaId"
        validators={{
          onChangeAsyncDebounceMs: 400,
          onChangeAsync: async ({ value }) => {
            setValidArenaId(null)
            // Silently skip if empty or bad format
            if (!value || !/^[a-zA-Z0-9]{10,50}$/.test(value)) {
              return undefined
            }
            try {
              await convex.query(api.arenas.get, {
                arenaId: value as Id<"arenas">
              })
              setValidArenaId(value as Id<"arenas">)
              return undefined
            } catch {
              return { message: "Arena not found" }
            }
          }
        }}
      >
        {(field) => (
          <Field>
            <FieldLabel>Arena ID</FieldLabel>
            <Input
              placeholder="Enter arena ID to join"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              className="border-border bg-background"
            />
            {field.state.meta.isValidating ? (
              <div className="text-muted-foreground text-xs">Checking...</div>
            ) : (
              <FieldError
                className="text-destructive text-xs"
                errors={field.state.meta.errors}
              />
            )}
            {validArenaId && !field.state.meta.isValidating && (
              <div className="text-green-500 text-xs">Arena found</div>
            )}
          </Field>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => [state.isSubmitting]}>
        {([isSubmitting]) => (
          <Button type="submit" disabled={!validArenaId || isSubmitting}>
            {isSubmitting ? "Joining..." : "Join Arena"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}

export function ArenaForm() {
  const [activeTab, setActiveTab] = useState<Tab>("join")

  return (
    <Card className="w-full max-w-md bg-secondary-background/80 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Arena</CardTitle>
        <CardDescription className="text-center">
          Create a new arena or join an existing one
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex border-border border-b" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "join"}
            onClick={() => setActiveTab("join")}
            className={cn(
              "flex-1 py-2 font-medium text-sm transition-colors",
              activeTab === "join"
                ? "border-foreground border-b-2 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Join arena
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "create"}
            onClick={() => setActiveTab("create")}
            className={cn(
              "flex-1 py-2 font-medium text-sm transition-colors",
              activeTab === "create"
                ? "border-foreground border-b-2 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Create arena
          </button>
        </div>

        {activeTab === "join" ? <JoinArenaForm /> : <CreateArenaForm />}
      </CardContent>
    </Card>
  )
}
