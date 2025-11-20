import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      style={{ fontFamily: "inherit", overflowWrap: "anywhere" }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "bg-background text-foreground border border-border font-mono text-[13px] flex items-center gap-2.5 p-4 w-[356px] [&:has(button)]:justify-between uppercase tracking-wide",
          description: "font-base opacity-80 normal-case",
          actionButton:
            "font-mono border text-[10px] h-6 px-2 bg-foreground text-background border-transparent rounded-none shrink-0 uppercase tracking-widest hover:bg-foreground/90",
          cancelButton:
            "font-mono border text-[10px] h-6 px-2 bg-background text-foreground border-border rounded-none shrink-0 uppercase tracking-widest hover:bg-secondary",
          error: "bg-destructive text-destructive-foreground",
          loading:
            "[&[data-sonner-toast]_[data-icon]]:flex [&[data-sonner-toast]_[data-icon]]:size-4 [&[data-sonner-toast]_[data-icon]]:relative [&[data-sonner-toast]_[data-icon]]:justify-start [&[data-sonner-toast]_[data-icon]]:items-center [&[data-sonner-toast]_[data-icon]]:flex-shrink-0"
        }
      }}
      {...props}
    />
  )
}

export { Toaster }
