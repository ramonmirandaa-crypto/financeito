import * as React from 'react'

interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/20 backdrop-blur-sm transition ${
          className
        }`}
        {...props}
      />
    )
  }
)

LiquidButton.displayName = 'LiquidButton'

export default LiquidButton
