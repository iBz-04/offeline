import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "bg-card text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {
  count: number;
  className?: string;
}

function Badge({ className, variant, count, ...props }: BadgeProps) {
  return (
    <div className={cn(
      "inline-flex items-center justify-center",
      "min-w-[20px] h-5 px-1.5",
      "text-xs font-bold text-white",
      "bg-foreground rounded-full",
      className
    )}>
      {count}
    </div>
  )
}

export { Badge, badgeVariants }
