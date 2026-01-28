/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const jumperInputVariants = cva(
  "flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
  {
    variants: {
      error: {
        true: "border-destructive bg-destructive/5 focus-visible:ring-destructive",
        false: "border-input bg-background focus-visible:ring-accent-subtle",
      },
    },
    defaultVariants: {
      error: false,
    },
  }
)

export interface JumperInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  error?: boolean | string
  onChange?: (value: string) => void
}

const JumperInput = React.forwardRef<HTMLInputElement, JumperInputProps>(
  ({ className, type, label, error, onChange, id, ...props }, ref) => {
    // Hook must be called unconditionally
    const generatedId = React.useId()
    
    const hasError = Boolean(error)
    const errorMessage = typeof error === 'string' ? error : undefined
    
    // Generate unique IDs for accessibility
    const inputId = id || generatedId
    const errorId = `${inputId}-error`

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value)
    }

    return (
      <div className="w-full space-y-2 form-field">
        {label && (
          <label 
            htmlFor={inputId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground"
          >
            {label}
            {props.required && <span className="text-destructive ml-1" aria-label="obrigatório">*</span>}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            jumperInputVariants({ error: hasError }),
            // Focus styles with subtle accent
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            // Border color on focus
            !hasError && "focus-visible:border-accent-subtle",
            className
          )}
          ref={ref}
          onChange={handleChange}
          aria-invalid={hasError}
          aria-describedby={errorMessage ? errorId : undefined}
          {...props}
        />
        {errorMessage && (
          <p 
            id={errorId}
            className="text-sm text-destructive error-message" 
            role="alert"
            aria-live="polite"
          >
            {errorMessage}
          </p>
        )}
      </div>
    )
  }
)
JumperInput.displayName = "JumperInput"

export { JumperInput, jumperInputVariants }