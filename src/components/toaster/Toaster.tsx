'use client'

import { AnimatePresence } from 'framer-motion'
import { useToasts } from '@/hooks/useToasts'
import ToastItem from './toast-item/ToastItem'

/**
 * Where toasts appear: bottom right, stacked, newest at the bottom; across the
 * bottom on a phone. Mounted once, in the root layout. The list is always in
 * the page (empty when there is nothing to say), so screen readers already
 * know the live region when a toast lands in it.
 */
export default function Toaster() {
  const toasts = useToasts()

  return (
    <ol
      aria-live="polite"
      className="fixed z-[60] bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:w-96 flex flex-col gap-2 pointer-events-none"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </ol>
  )
}
