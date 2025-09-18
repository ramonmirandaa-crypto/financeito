import * as React from 'react'

interface LiquidInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const LiquidInput = React.forwardRef<HTMLInputElement, LiquidInputProps>(
  ({ className = '', error, ...props }, ref) => {
    const base =
      'bg-card/60 text-foreground placeholder-foreground/60 dark:text-white dark:placeholder-white/60 border border-border rounded-xl px-3 py-2 w-full focus-visible:outline-none focus-visible:ring focus-visible:ring-primary/40'
    const errorClasses = error ? 'border-red-500 focus-visible:ring-red-500' : ''

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
