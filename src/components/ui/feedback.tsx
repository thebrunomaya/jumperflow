/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, Loader2 } from "lucide-react"

const feedbackVariants = cva(
  "relative flex items-center gap-3 rounded-md p-4 text-sm transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        success: "bg-success/10 text-success-foreground border border-success/20",
        error: "bg-destructive/10 text-destructive-foreground border border-destructive/20",
        warning: "bg-warning/10 text-warning-foreground border border-warning/20",
        info: "bg-primary/10 text-primary-foreground border border-primary/20",
        loading: "bg-muted/50 text-muted-foreground border border-muted",
      },
      size: {
        sm: "p-3 text-xs",
        default: "p-4 text-sm",
        lg: "p-5 text-base",
      }
    },
    defaultVariants: {
      variant: "info",
      size: "default",
    },
  }
)

interface FeedbackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof feedbackVariants> {
  title?: string
  description?: string
  dismissible?: boolean
  onDismiss?: () => void
  icon?: React.ReactNode
}

const FeedbackIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
}

const Feedback = React.forwardRef<HTMLDivElement, FeedbackProps>(
  ({ className, variant = "info", size, title, description, dismissible, onDismiss, icon, children, ...props }, ref) => {
    const IconComponent = variant ? FeedbackIcons[variant] : Info
    
    return (
      <div
        ref={ref}
        className={cn(feedbackVariants({ variant, size }), className)}
        role="alert"
        aria-live="polite"
        {...props}
      >
        <div className="flex-shrink-0">
          {icon || (
            <IconComponent 
              className={cn(
                "h-5 w-5",
                variant === "loading" && "animate-spin"
              )} 
            />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-medium mb-1">{title}</h4>
          )}
          {description && (
            <p className="opacity-90">{description}</p>
          )}
          {children}
        </div>
        
        {dismissible && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Fechar notificação"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Feedback.displayName = "Feedback"

// Specific feedback components for common patterns
const SuccessMessage: React.FC<Omit<FeedbackProps, 'variant'>> = (props) => (
  <Feedback variant="success" {...props} />
)

const ErrorMessage: React.FC<Omit<FeedbackProps, 'variant'>> = (props) => (
  <Feedback variant="error" {...props} />
)

const WarningMessage: React.FC<Omit<FeedbackProps, 'variant'>> = (props) => (
  <Feedback variant="warning" {...props} />
)

const InfoMessage: React.FC<Omit<FeedbackProps, 'variant'>> = (props) => (
  <Feedback variant="info" {...props} />
)

const LoadingMessage: React.FC<Omit<FeedbackProps, 'variant'>> = (props) => (
  <Feedback variant="loading" {...props} />
)

// Progress feedback component
interface ProgressFeedbackProps extends Omit<FeedbackProps, 'variant' | 'children'> {
  progress: number // 0-100
  showPercentage?: boolean
}

const ProgressFeedback: React.FC<ProgressFeedbackProps> = ({
  progress,
  showPercentage = true,
  title = "Processando...",
  className,
  ...props
}) => (
  <Feedback
    variant="info"
    className={cn("space-y-2", className)}
    {...props}
  >
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">{title}</span>
        {showPercentage && (
          <span className="text-sm opacity-75">{progress}%</span>
        )}
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  </Feedback>
)

// Inline feedback for forms
interface InlineFeedbackProps {
  message: string
  variant: "success" | "error" | "warning"
  className?: string
}

const InlineFeedback: React.FC<InlineFeedbackProps> = ({ 
  message, 
  variant, 
  className 
}) => {
  const IconComponent = FeedbackIcons[variant]
  
  return (
    <div 
      className={cn("flex items-center gap-2 text-sm mt-1", className)}
      role="alert"
      aria-live="polite"
    >
      <IconComponent className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// Status indicator dot
interface StatusDotProps {
  status: "online" | "offline" | "busy" | "idle"
  className?: string
  showLabel?: boolean
}

const StatusDot: React.FC<StatusDotProps> = ({ 
  status, 
  className, 
  showLabel = false 
}) => {
  const statusConfig = {
    online: { color: "bg-green-500", label: "Online" },
    offline: { color: "bg-gray-400", label: "Offline" },
    busy: { color: "bg-red-500", label: "Ocupado" },
    idle: { color: "bg-yellow-500", label: "Ausente" }
  }
  
  const config = statusConfig[status]
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <div className={cn("w-3 h-3 rounded-full", config.color)} />
        {status === "online" && (
          <div className={cn("absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-75", config.color)} />
        )}
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground">{config.label}</span>
      )}
    </div>
  )
}

export { 
  Feedback,
  SuccessMessage,
  ErrorMessage,
  WarningMessage,
  InfoMessage,
  LoadingMessage,
  ProgressFeedback,
  InlineFeedback,
  StatusDot,
  feedbackVariants 
}