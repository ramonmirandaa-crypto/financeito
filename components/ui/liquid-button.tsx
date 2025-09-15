import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface LiquidButtonProps {
  className?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  glowColor?: string
  children?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  'aria-label'?: string
  'aria-describedby'?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void
}

export const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
  ({ 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    glowColor, 
    children, 
    onClick, 
    disabled, 
    type = 'button',
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedby,
    onKeyDown
  }, ref) => {
    const shouldReduceMotion = useReducedMotion()
    const baseClasses =
      'bg-card-glass/60 border border-card-border/50 backdrop-blur-glass font-medium transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed focus-ring'

    const variantClasses = {
      primary:
        'bg-primary text-primary-foreground hover:bg-primary/90 border-primary',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary-hover border-secondary',
      outline:
        'bg-transparent hover:bg-accent/20 text-foreground border-border',
      ghost:
        'bg-transparent hover:bg-accent/10 text-foreground border-transparent',
    }
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm rounded-xl',
      md: 'px-4 py-2.5 text-sm rounded-xl', 
      lg: 'px-6 py-3 text-base rounded-2xl'
    }

    return (
      <motion.button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        style={{
          ...(glowColor && {
            filter: `drop-shadow(0 0 12px ${glowColor}60)`
          })
        }}
        whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeInOut" }}
        onClick={onClick}
        disabled={disabled}
        type={type}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        onKeyDown={onKeyDown}
      >
        {/* Animated background glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary-glow/20 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="relative z-10">{children}</span>
      </motion.button>
    )
  }
)

LiquidButton.displayName = 'LiquidButton'

export default LiquidButton
