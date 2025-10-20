import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const modelBadgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      color: {
        red: "border-transparent bg-red-500 text-white shadow hover:bg-red-500/80",
        yellow: "border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-500/80",
        green: "border-transparent bg-green-500 text-white shadow hover:bg-green-500/80",
        blue: "border-transparent bg-blue-500 text-white shadow hover:bg-blue-500/80",
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
      },
    },
    defaultVariants: {
      color: "default",
    },
  }
)

export interface ModelBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modelBadgeVariants> {
  color?: "red" | "yellow" | "green" | "blue";
}

function ModelBadge({ className, color, children, ...props }: ModelBadgeProps) {
  return (
    <div className={cn(modelBadgeVariants({ color }), className)} {...props}>
      {children}
    </div>
  )
}

export { ModelBadge, modelBadgeVariants }