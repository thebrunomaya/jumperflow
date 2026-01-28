/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"

// Import official Jumper Studio assets
import xWhite from "@/assets/x-white.png"
import xBlack from "@/assets/x-black.png"
import jumperFullLogoWhite from "@/assets/jumper-full-logo-white.png"
import jumperFullLogoBlack from "@/assets/jumper-full-logo-black.png"

const jumperLogoVariants = cva(
  "flex items-center",
  {
    variants: {
      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
      },
      theme: {
        light: "",
        dark: "",
        auto: "",
      },
    },
    defaultVariants: {
      size: "md",
      theme: "auto",
    },
  }
)

const logoSymbolVariants = cva(
  "object-contain flex-shrink-0",
  {
    variants: {
      size: {
        sm: "w-6 h-6",
        md: "w-8 h-8",
        lg: "w-10 h-10",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const logoCompleteVariants = cva(
  "object-contain h-auto",
  {
    variants: {
      size: {
        sm: "h-6",
        md: "h-8",
        lg: "h-10",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface JumperLogoProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof jumperLogoVariants> {
  showText?: boolean
  theme?: 'light' | 'dark' | 'auto'
}

const JumperLogo = React.forwardRef<HTMLDivElement, JumperLogoProps>(
  ({ className, size, theme = 'auto', showText = true, ...props }, ref) => {
    
    const { theme: contextTheme } = useTheme()
    
    // Determine which theme to use
    const getEffectiveTheme = () => {
      if (theme === 'auto') {
        // Use theme from context for reactive updates
        return contextTheme === 'dark' ? 'dark' : 'light'
      }
      return theme
    }

    const effectiveTheme = getEffectiveTheme()
    
    // Select correct assets based on theme and showText
    const symbolSrc = effectiveTheme === 'dark' ? xWhite : xBlack
    const fullLogoSrc = effectiveTheme === 'dark' ? jumperFullLogoWhite : jumperFullLogoBlack

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
      // Fallback: hide image and show text
      e.currentTarget.style.display = 'none'
    }

    return (
      <div
        className={cn(jumperLogoVariants({ size, theme, className }))}
        ref={ref}
        {...props}
      >
        {showText ? (
          /* Use complete logo when text is needed */
          <img
            src={fullLogoSrc}
            alt="Jumper Studio"
            className={cn(logoCompleteVariants({ size }))}
            onError={(e) => {
              // Fallback to text if image fails
              const parent = e.currentTarget.parentElement
              if (parent) {
                e.currentTarget.style.display = 'none'
                const fallbackText = document.createElement('span')
                fallbackText.textContent = 'Jumper Studio'
                fallbackText.className = 'font-semibold tracking-tight text-foreground'
                parent.appendChild(fallbackText)
              }
            }}
            loading="lazy"
          />
        ) : (
          /* Use only symbol when text is not needed */
          <img 
            src={symbolSrc}
            alt="Jumper Studio"
            className={cn(logoSymbolVariants({ size }))}
            onError={handleImageError}
            loading="lazy"
          />
        )}
      </div>
    )
  }
)
JumperLogo.displayName = "JumperLogo"

export { JumperLogo, jumperLogoVariants }