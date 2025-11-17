import { cn } from "@/lib/utils"

interface SpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function Spinner({ className, size = "md" }: SpinnerProps) {
  const containerSizes = {
    sm: "size-5 gap-0.5",
    md: "size-8 gap-1",
    lg: "size-12 gap-1.5"
  }

  const squareSizes = {
    sm: "size-2",
    md: "size-3",
    lg: "size-4"
  }

  return (
    <div
      className={cn(
        "relative inline-grid grid-cols-2",
        containerSizes[size],
        className
      )}
    >
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className={cn(
            "bg-main border-2 border-border shadow-shadow",
            squareSizes[size],
            "animate-pulse"
          )}
          style={{
            animationDelay: `${index * 0.15}s`,
            animationDuration: "0.8s"
          }}
        />
      ))}
    </div>
  )
}

