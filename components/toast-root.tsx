'use client'

import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export function ToastRoot() {
  return (
    <ToastContainer
      position="top-right"
      newestOnTop
      pauseOnHover
      closeOnClick
      draggable
      toastClassName="rounded-xl border border-border/60 bg-background/95 text-foreground shadow-lg backdrop-blur-sm"
      bodyClassName="flex flex-col gap-1 text-sm"
      progressClassName="bg-primary"
    />
  )
}
