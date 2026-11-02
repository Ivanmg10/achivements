import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { IconAlertCircle, IconCircleCheck, IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { dismissToast, type Toast } from '@/lib/notify'

/** Errors stay longer: they usually need reading, and acting on. */
export const TOAST_MS = { success: 4000, error: 7000 } as const

// A dark card on every theme; the tone is on the icon, the edge and the time line.
const TONE = {
  success: { icon: 'text-success', edge: 'bg-success' },
  error: { icon: 'text-danger', edge: 'bg-danger' },
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
      className="relative overflow-hidden pointer-events-auto flex items-start gap-3 rounded-control pl-5 pr-3 py-3 text-sm bg-bg-header text-text-main ring-1 ring-ink/12 shadow-2xl shadow-black/50"
    >
      <span aria-hidden="true" className={`absolute left-0 top-0 bottom-0 w-1 ${TONE[toast.kind].edge}`} />
      <Icon size={20} className={`shrink-0 mt-px ${TONE[toast.kind].icon}`} aria-hidden="true" />
      <p className="flex-1 min-w-0 break-words">{toast.message}</p>
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.onClick()
            dismissToast(toast.id)
          }}
          className="shrink-0 -my-0.5 px-2 py-0.5 rounded-chip font-semibold text-accent hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => dismissToast(toast.id)}
        aria-label={T.toast.close}
        className="shrink-0 -mr-1 p-0.5 rounded-chip text-text-secondary hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        <IconX size={16} aria-hidden="true" />
      </button>
      <span
        aria-hidden="true"
        className={`absolute left-0 bottom-0 h-0.5 w-full origin-left opacity-60 animate-[toast-time_linear_forwards] motion-reduce:hidden ${TONE[toast.kind].edge}`}
        style={{ animationDuration: `${TOAST_MS[toast.kind]}ms`, animationPlayState: paused ? 'paused' : 'running' }}
      />
    </motion.li>
  )
}
