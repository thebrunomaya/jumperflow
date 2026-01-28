/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const jumperBackgroundVariants = cva(
  "relative min-h-screen w-full overflow-hidden",
  {
    variants: {
      variant: {
        1: "",
        2: "",
        3: "",
        4: "",
        5: "",
        6: "",
        7: "",
      },
    },
    defaultVariants: {
      variant: 1,
    },
  }
)

const getSolidColorStyle = (variant: number) => {
  const colorMap = {
    1: 'hsl(var(--background))',
    2: 'hsl(var(--jumper-orange-solid))',
    3: 'hsl(var(--jumper-purple-solid))',
    4: 'hsl(var(--background))',
    5: 'hsl(var(--jumper-orange-solid))',
    6: 'hsl(var(--jumper-purple-solid))',
    7: 'hsl(var(--background))',
  }
  
  return {
    backgroundColor: colorMap[variant as keyof typeof colorMap] || colorMap[1],
  }
}

export interface JumperBackgroundProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof jumperBackgroundVariants> {
  variant?: 1 | 2 | 3 | 4 | 5 | 6 | 7
  overlay?: boolean
}

const JumperBackground = React.forwardRef<HTMLDivElement, JumperBackgroundProps>(
  ({ className, variant = 1, overlay = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(jumperBackgroundVariants({ variant }), className)}
        style={getSolidColorStyle(variant)}
        {...props}
      >
        {/* Overlay escuro para contraste */}
        {overlay && (
          <div 
            className="absolute inset-0 z-0"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
            }}
          />
        )}
        
        {/* Conteúdo */}
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </div>
    )
  }
)
JumperBackground.displayName = "JumperBackground"

export { JumperBackground, jumperBackgroundVariants }