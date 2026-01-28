/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const jumperButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: 
          "bg-slate-700 text-white hover:bg-jumper-orange hover:shadow-md transition-all duration-200",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: 
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
        critical:
          "bg-jumper-orange text-white hover:bg-jumper-orange/90 active:bg-jumper-orange/95",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface JumperButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof jumperButtonVariants> {
  asChild?: boolean
}

const JumperButton = React.forwardRef<HTMLButtonElement, JumperButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(jumperButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
JumperButton.displayName = "JumperButton"

export { JumperButton, jumperButtonVariants }