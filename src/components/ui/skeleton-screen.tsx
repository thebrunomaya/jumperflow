/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const skeletonVariants = cva(
  "animate-pulse bg-muted rounded-md",
  {
    variants: {
      variant: {
        default: "bg-muted",
        shimmer: "bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_2s_infinite]",
        jumper: "bg-gradient-to-r from-[hsl(var(--orange-subtle))] via-muted/50 to-[hsl(var(--orange-subtle))] bg-[length:200%_100%] animate-[shimmer_2s_infinite]",
        text: "bg-muted/70 h-4",
        heading: "bg-muted/70 h-6",
        circle: "bg-muted rounded-full",
        card: "bg-muted/30 border border-muted",
        metric: "bg-muted/50 border-l-4 border-l-muted/50",
      },
      size: {
        sm: "h-4",
        default: "h-6",
        lg: "h-8",
        xl: "h-12",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: string | number
  height?: string | number
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, size, width, height, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant, size }), className)}
        style={{
          width,
          height,
          ...style
        }}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

// Pre-made skeleton components for common patterns
const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 1, 
  className 
}) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton 
        key={i} 
        variant="text" 
        className={i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"} 
      />
    ))}
  </div>
)

const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("space-y-4", className)}>
    <div className="flex items-center space-x-4">
      <Skeleton variant="circle" className="h-12 w-12" />
      <div className="space-y-2 flex-1">
        <Skeleton variant="heading" className="w-1/2" />
        <Skeleton variant="text" className="w-3/4" />
      </div>
    </div>
    <Skeleton variant="card" className="h-32 w-full" />
    <SkeletonText lines={3} />
  </div>
)

const SkeletonTable: React.FC<{ 
  rows?: number
  cols?: number
  className?: string 
}> = ({ 
  rows = 5, 
  cols = 4, 
  className 
}) => (
  <div className={cn("space-y-3", className)}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: cols }, (_, i) => (
        <Skeleton key={i} variant="heading" className="flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: cols }, (_, colIndex) => (
          <Skeleton key={colIndex} variant="text" className="flex-1" />
        ))}
      </div>
    ))}
  </div>
)

const SkeletonButton: React.FC<{ className?: string }> = ({ className }) => (
  <Skeleton className={cn("h-10 w-24", className)} />
)

const SkeletonAvatar: React.FC<{ size?: "sm" | "md" | "lg"; className?: string }> = ({ 
  size = "md", 
  className 
}) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-12 w-12"
  }
  
  return (
    <Skeleton 
      variant="circle" 
      className={cn(sizeClasses[size], className)} 
    />
  )
}

// Jumper-branded skeleton components for dashboards
const SkeletonMetricCard: React.FC<{ 
  isHero?: boolean; 
  className?: string 
}> = ({ isHero = false, className }) => (
  <div 
    className={cn(
      "p-4 rounded-lg border transition-all duration-200",
      "border-l-4 border-l-muted/50",
      isHero && "ring-2 ring-[hsl(var(--orange-hero)/0.1)] bg-[hsl(var(--orange-subtle)/0.3)]",
      className
    )}
  >
    <div className="flex items-center justify-between mb-2">
      <Skeleton variant="text" width="70%" />
      <div className="p-1 rounded-md bg-muted/20">
        <Skeleton variant="circle" className="h-4 w-4" />
      </div>
    </div>
    <Skeleton 
      variant={isHero ? "jumper" : "default"}
      height={isHero ? "32px" : "24px"} 
      width="60%" 
      className="mb-1"
    />
    <Skeleton variant="text" width="80%" height="12px" />
  </div>
)

const SkeletonDashboard: React.FC<{ 
  cardCount?: number;
  heroCards?: number;
  showHeader?: boolean;
  className?: string;
}> = ({ 
  cardCount = 4, 
  heroCards = 2, 
  showHeader = true,
  className 
}) => (
  <div 
    className={cn("space-y-6", className)}
    role="status"
    aria-live="polite"
    aria-label="Carregando dashboard..."
  >
    <span className="sr-only">Carregando métricas da Jumper Studio...</span>
    
    {/* Header */}
    {showHeader && (
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="heading" className="w-64" />
          <Skeleton variant="text" className="w-48" />
        </div>
        <div className="flex gap-2">
          <SkeletonButton className="w-28" />
        </div>
      </div>
    )}

    {/* Loading indicator with Jumper branding */}
    <div className="flex items-center justify-center py-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="h-6 w-6 rounded-full border-2 border-[hsl(var(--orange-hero))] border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 h-6 w-6 rounded-full border border-[hsl(var(--orange-hero)/0.3)]"></div>
        </div>
        <span className="text-sm text-muted-foreground font-medium">
          Carregando métricas da Jumper Studio...
        </span>
      </div>
    </div>

    {/* Metric Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: cardCount }).map((_, index) => (
        <SkeletonMetricCard 
          key={index}
          isHero={index < heroCards}
        />
      ))}
    </div>

    {/* Additional content sections */}
    <div className="space-y-4">
      {/* Funnel section skeleton */}
      <div className="p-6 rounded-lg border">
        <div className="space-y-2 mb-4">
          <Skeleton variant="heading" width="150px" />
          <Skeleton variant="text" width="200px" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="text-center space-y-2">
              <Skeleton variant="circle" className="h-8 w-8 mx-auto" />
              <Skeleton variant="jumper" height="24px" width="60px" className="mx-auto" />
              <Skeleton variant="text" width="80px" className="mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Table section skeleton */}
      <div className="p-6 rounded-lg border">
        <div className="space-y-2 mb-4">
          <Skeleton variant="heading" width="180px" />
          <Skeleton variant="text" width="220px" />
        </div>
        <SkeletonTable rows={5} cols={4} />
      </div>
    </div>
  </div>
)

// Loading state with ARIA attributes for accessibility
const SkeletonPage: React.FC<{ className?: string }> = ({ className }) => (
  <div 
    className={cn("space-y-6", className)}
    role="status"
    aria-live="polite"
    aria-label="Carregando conteúdo..."
  >
    <span className="sr-only">Carregando página...</span>
    
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton variant="heading" className="w-64" />
        <Skeleton variant="text" className="w-80" />
      </div>
      <div className="flex space-x-2">
        <SkeletonButton />
        <SkeletonButton />
      </div>
    </div>
    
    {/* Content */}
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
)

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonButton, 
  SkeletonAvatar, 
  SkeletonPage,
  SkeletonMetricCard,
  SkeletonDashboard,
  skeletonVariants 
}

// Add shimmer animation to CSS
export const skeletonStyles = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
`