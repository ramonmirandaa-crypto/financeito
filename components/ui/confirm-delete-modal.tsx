"use client"

import { useId } from 'react'
import { LiquidCard } from '@/components/ui/liquid-card'
import { LiquidButton } from '@/components/ui/liquid-button'
import { cn } from '@/lib/utils'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  title?: string
  message: string
  cancelLabel?: string
  confirmLabel?: string
  onCancel: () => void
  onConfirm: () => void
  cancelButtonClassName?: string
  confirmButtonClassName?: string
}

export function ConfirmDeleteModal({
  isOpen,
  title = 'Confirmar Exclusão',
  message,
  cancelLabel = 'Cancelar',
  confirmLabel = 'Excluir',
  onCancel,
  onConfirm,
  cancelButtonClassName,
  confirmButtonClassName
}: ConfirmDeleteModalProps) {
  const titleId = useId()
  const descriptionId = useId()

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <LiquidCard
        className="max-w-md w-full m-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <h3 id={titleId} className="text-xl font-semibold mb-4 text-white">
          {title}
        </h3>
        <p id={descriptionId} className="text-slate-400 mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <LiquidButton
            variant="secondary"
            onClick={onCancel}
            className={cn('flex-1', cancelButtonClassName)}
          >
            {cancelLabel}
          </LiquidButton>
          <LiquidButton
            variant="primary"
            onClick={onConfirm}
            className={cn('flex-1 bg-red-500 hover:bg-red-600', confirmButtonClassName)}
          >
            {confirmLabel}
          </LiquidButton>
        </div>
      </LiquidCard>
    </div>
  )
}

export default ConfirmDeleteModal
