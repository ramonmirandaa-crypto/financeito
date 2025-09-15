import * as React from 'react'

interface LiquidInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const LiquidInput = React.forwardRef<HTMLInputElement, LiquidInputProps>(
  ({ className = '', error, ...props }, ref) => {
    const base = 'bg-card/40 border border-card-border/50 rounded-xl px-3 py-2 w-full text-white placeholder-slate-400 focus:outline-none'
    const errorClasses = error ? 'border-red-500 focus:ring-red-500' : ''

    return (
      <input
        ref={ref}
        className={`${base} ${errorClasses} ${className}`}
        {...props}
      />
    )
  }
)

LiquidInput.displayName = 'LiquidInput'

export default LiquidInput
