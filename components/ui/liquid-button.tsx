import * as React from 'react'
import { motion } from 'framer-motion'

interface LiquidButtonProps {
  className?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  glowColor?: string
  children?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', glowColor, children, onClick, disabled, type = 'button' }, ref) => {
    const baseClasses = 'glass-effect font-medium transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variantClasses = {
      primary: 'bg-gradient-to-r from-blue-500/30 to-purple-600/30 hover:from-blue-500/40 hover:to-purple-600/40 text-white border-blue-400/30',
      secondary: 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/20',
      outline: 'bg-transparent hover:bg-white/10 text-slate-300 border-white/30',
      ghost: 'bg-transparent hover:bg-white/5 text-slate-300 border-transparent'
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
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        onClick={onClick}
        disabled={disabled}
        type={type}
      >
        {/* Animated background glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="relative z-10">{children}</span>
      </motion.button>
    )
  }
)

LiquidButton.displayName = 'LiquidButton'

export default LiquidButton
