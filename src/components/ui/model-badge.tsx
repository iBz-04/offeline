import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const modelBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-[#f2f0ed]",
  {
    variants: {
      color: {
        red: "bg-[#c9a8a8]",
        yellow: "bg-[#c9b894]",
        green: "bg-[#9bb8a0]",
        blue: "bg-[#97adbf]",
        default: "bg-secondary text-muted-foreground",
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