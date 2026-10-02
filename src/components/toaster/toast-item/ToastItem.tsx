import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { IconAlertCircle, IconCircleCheck, IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { dismissToast, type Toast } from '@/lib/notify'

/** Errors stay longer: they usually need reading, and acting on. */
export const TOAST_MS = { success: 4000, error: 7000 } as const

// Solid colours, as dark as needed for white text to pass WCAG AA (4.5:1).
const STYLE = {
  success: 'bg-green-700 text-white',
  error: 'bg-red-700 text-white',
} as const

/**
 * One toast. It goes by itself after TOAST_MS, but not while the pointer is on
 * it or it has keyboard focus, so it can always be read to the end. The icon
 * says success or failure as well as the colour does.
 */
export default function ToastItem({ toast }: { toast: Toast }) {
  const { T } = useLanguage()
  const reduceMotion = useReducedMotion()
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const timer = setTimeout(() => dismissToast(toast.id), TOAST_MS[toast.kind])
    return () => clearTimeout(timer)
  }, [paused, toast.id, toast.kind])

  const Icon = toast.kind === 'success' ? IconCircleCheck : IconAlertCircle

  return (
    <motion.li
      layout={!reduceMotion}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      role={toast.kind === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 shadow-2xl text-sm ${STYLE[toast.kind]}`}
    >
      <Icon size={20} className="shrink-0 mt-px" aria-hidden="true" />
      <p className="flex-1 min-w-0 break-words">{toast.message}</p>
      <button
        onClick={() => dismissToast(toast.id)}
        aria-label={T.toast.close}
        className="shrink-0 -mr-1 p-0.5 rounded opacity-80 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <IconX size={16} aria-hidden="true" />
      </button>
    </motion.li>
  )
}
