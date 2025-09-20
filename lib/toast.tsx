'use client'

import type { ReactNode } from 'react'
import {
  toast as toastify,
  type ToastOptions,
  type ToastContent,
  type ToastId,
} from 'react-toastify'

export interface AppToastOptions extends Omit<ToastOptions, 'autoClose' | 'closeOnClick' | 'closeButton' | 'draggable'> {
  duration?: ToastOptions['autoClose']
  dismissible?: boolean
}

export type ToastMethod = (title: string, message?: string, options?: AppToastOptions) => ToastId

export interface ToastLike {
  success: ToastMethod
  error: ToastMethod
  warning: ToastMethod
  info: ToastMethod
}

const renderContent = (title: string, message?: string): ReactNode => (
  <div className="flex flex-col gap-1">
    <span className="font-semibold leading-tight">{title}</span>
    {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
  </div>
)

const mapOptions = (options?: AppToastOptions): ToastOptions | undefined => {
  if (!options) {
    return undefined
  }

  const { duration, dismissible, ...rest } = options
  const mapped: ToastOptions = { ...rest }

  if (typeof duration !== 'undefined') {
    mapped.autoClose = duration
  }

  if (dismissible === false) {
    mapped.closeOnClick = false
    mapped.closeButton = false
    mapped.draggable = false
  }

  return mapped
}

const createToast = (
  method: (content: ToastContent, options?: ToastOptions) => ToastId,
): ToastMethod =>
  (title, message, options) => method(renderContent(title, message), mapOptions(options))

export const toast: ToastLike & Pick<typeof toastify, 'dismiss' | 'update' | 'isActive'> = {
  success: createToast(toastify.success),
  error: createToast(toastify.error),
  warning: createToast(toastify.warning),
  info: createToast(toastify.info),
  dismiss: toastify.dismiss,
  update: toastify.update,
  isActive: toastify.isActive,
}
