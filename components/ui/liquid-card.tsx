import * as React from 'react'
import { motion } from 'framer-motion'

interface LiquidCardProps {
  className?: string
  style?: React.CSSProperties
  variant?: 'default' | 'hoverable' | 'interactive'
  glowColor?: string
  children?: React.ReactNode
  onClick?: () => void
}

export const LiquidCard = React.forwardRef<HTMLDivElement, LiquidCardProps>(
  ({ className = '', style, variant = 'default', glowColor, children, onClick }, ref) => {
    const baseClasses = 'glass-effect rounded-3xl p-6 relative overflow-hidden'
    const variantClasses = {
      default: '',
      hoverable: 'glass-hover cursor-pointer',
      interactive: 'glass-hover cursor-pointer'
    }

    return (
      <motion.div
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        style={{
          ...(glowColor && {
            filter: `drop-shadow(0 0 20px ${glowColor}40)`
          }),
          ...(style || {}),
        }}
        whileHover={variant === 'interactive' ? { scale: 1.02 } : {}}
        whileTap={variant === 'interactive' ? { scale: 0.98 } : {}}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={onClick}
      >
        {/* Subtle animated background pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-blue-400/30 to-purple-600/30 rounded-full blur-3xl floating-animation" />
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    )
  }
)

LiquidCard.displayName = 'LiquidCard'

export default LiquidCard
