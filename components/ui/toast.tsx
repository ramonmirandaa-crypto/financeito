'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { Toast as ToastType, useToast } from '@/contexts/toast-context'

const getToastIcon = (type: ToastType['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="w-5 h-5 text-green-400" />
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-400" />
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-amber-400" />
    case 'info':
      return <Info className="w-5 h-5 text-blue-400" />
    default:
      return <Info className="w-5 h-5 text-blue-400" />
  }
}

const getToastColors = (type: ToastType['type']) => {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-green-500/10',
        border: 'border-green-400/30',
        glow: 'shadow-green-400/20'
      }
    case 'error':
      return {
        bg: 'bg-red-500/10',
        border: 'border-red-400/30',
        glow: 'shadow-red-400/20'
      }
    case 'warning':
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-400/30',
        glow: 'shadow-amber-400/20'
      }
    case 'info':
      return {
        bg: 'bg-blue-500/10',
        border: 'border-blue-400/30',
        glow: 'shadow-blue-400/20'
      }
    default:
      return {
        bg: 'bg-white/10',
        border: 'border-white/20',
        glow: 'shadow-white/20'
      }
  }
}

interface ToastItemProps {
  toast: ToastType
  onDismiss: (id: string) => void
}

export const ToastItem = ({ toast, onDismiss }: ToastItemProps) => {
  const [progress, setProgress] = useState(100)
  const colors = getToastColors(toast.type)
  const icon = getToastIcon(toast.type)

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (toast.duration! / 100))
        return newProgress <= 0 ? 0 : newProgress
      })
    }, 100)

    return () => clearInterval(interval)
  }, [toast.duration])

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className={`
        relative max-w-sm w-full backdrop-blur-md border rounded-2xl p-4
        shadow-lg ${colors.bg} ${colors.border} ${colors.glow}
        overflow-hidden
      `}
    >
      {/* Progress bar para auto-dismiss */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-white/40 to-white/60"
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div className="flex-shrink-0 mt-0.5">
          {icon}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white mb-1">
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-sm text-white/70 leading-relaxed">
              {toast.message}
            </p>
          )}
        </div>

        {/* Botão de fechar */}
        {toast.dismissible && (
          <button
            onClick={() => onDismiss(toast.id)}
            className="
              flex-shrink-0 p-1 rounded-lg text-white/60 
              hover:text-white hover:bg-white/10 
              transition-all duration-200
            "
            aria-label="Fechar notificação"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

export const ToastContainer = () => {
  const { toasts, dismissToast } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-h-screen overflow-hidden">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}