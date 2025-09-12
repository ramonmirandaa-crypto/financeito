import * as React from 'react'

interface LiquidCardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const LiquidCard = React.forwardRef<HTMLDivElement, LiquidCardProps>(
  ({ className = '', style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-xl ${className}`}
        style={{
          boxShadow:
            '0 8px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
          ...(style || {}),
        }}
        {...props}
      />
    )
  }
)

LiquidCard.displayName = 'LiquidCard'

export default LiquidCard
