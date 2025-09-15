import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string | number
  height?: string | number
  lines?: number
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangular', 
  width = '100%', 
  height = '1rem',
  lines = 1 
}: SkeletonProps) {
  const baseClasses = 'bg-gradient-to-r from-card-glass/30 via-card-glass/50 to-card-glass/30 bg-[length:400%_100%] animate-pulse'
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded',
    card: 'rounded-3xl'
  }

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={`${baseClasses} ${variantClasses[variant]}`}
            style={{
              ...style,
              width: index === lines - 1 && lines > 1 ? '60%' : style.width
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    />
  )
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-card-glass/60 border border-card-border/50 backdrop-blur-glass rounded-3xl p-6 ${className}`}>
      <Skeleton variant="text" height="1.5rem" width="60%" className="mb-4" />
      <div className="space-y-3">
        <Skeleton variant="rectangular" height="8rem" />
        <div className="space-y-2">
          <Skeleton variant="text" lines={3} />
        </div>
      </div>
    </div>
  )
}

export function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-card-glass/60 border border-card-border/50 backdrop-blur-glass rounded-3xl p-6 text-center">
          <Skeleton variant="text" height="2rem" width="80%" className="mb-2 mx-auto" />
          <Skeleton variant="text" height="0.875rem" width="60%" className="mx-auto" />
        </div>
      ))}
    </div>
  )
}

export function TransactionSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex justify-between items-center p-2 bg-card-glass/20 rounded">
          <div className="flex-1">
            <Skeleton variant="text" width="70%" height="1rem" className="mb-1" />
            <Skeleton variant="text" width="40%" height="0.75rem" />
          </div>
          <Skeleton variant="text" width="5rem" height="1rem" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton({ height = "200px" }: { height?: string }) {
  return (
    <div className="w-full flex items-center justify-center" style={{ height }}>
      <div className="text-center space-y-3">
        <motion.div
          className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full mx-auto"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <Skeleton variant="text" width="8rem" height="0.875rem" className="mx-auto" />
      </div>
    </div>
  )
}