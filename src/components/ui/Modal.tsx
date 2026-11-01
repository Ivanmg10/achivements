import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

const SIZES = { sm: 'sm:max-w-[27.5rem]', md: 'sm:max-w-[33.75rem]', lg: 'sm:max-w-[47.5rem]', xl: 'sm:max-w-5xl', '2xl': 'sm:max-w-[77.5rem]' } as const
const BACKDROPS = { default: 'bg-black/60 backdrop-blur-[2px]', opaque: 'bg-bg-main' } as const
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export type ModalProps = {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  /** The head: a title (it names the dialog), a line under it and an icon in a tile. */
  title?: React.ReactNode
  hint?: React.ReactNode
  icon?: React.ReactNode
  /** Its own row under a hairline: the actions. */
  footer?: React.ReactNode
  size?: keyof typeof SIZES
  /** A confirmation that destroys something: `alertdialog`, the icon in the danger colour. */
  tone?: 'default' | 'danger'
  /** How much of the page behind shows through; `opaque` is none at all, for a chooser whose changes would reach that page. */
  backdrop?: keyof typeof BACKDROPS
  /** The quiet ✕ in the corner; on unless the content has its own way out. */
  showClose?: boolean
  /** Names the dialog when there is no `title` (otherwise its first heading does). */
  'aria-label'?: string
  /** Or the id of the element in the content that names it. */
  'aria-labelledby'?: string
  /** Layout of the body only (gap, padding). */
  className?: string
}

/**
 * The library's dialog: on <body>, over a dimmed page; a centred card from
 * `sm`, a sheet rising from the bottom on a phone. Escape and a click outside
 * close it, focus stays inside while it is open and goes back where it was.
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  hint,
  icon,
  footer,
  size = 'sm',
  tone = 'default',
  backdrop = 'default',
  showClose = true,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  className = 'gap-5',
}: ModalProps) {
  const { T } = useLanguage()
  const reduce = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  const titleId = useId()
  const hintId = useId()

  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (!isOpen) return
    const back = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    // Name it by its first heading when it has no title of its own.
    if (panel && !title && !ariaLabel && !labelledBy) {
      const heading = panel.querySelector<HTMLElement>('h1, h2, h3')
      if (heading) {
        heading.id ||= `${titleId}-heading`
        panel.setAttribute('aria-labelledby', heading.id)
      }
    }
    // The dialog itself takes focus (its name is read first), or a field marked autoFocus.
    ;(panel?.querySelector<HTMLElement>('[autofocus]') ?? panel)?.focus()

    function onKey(e: KeyboardEvent) {
      // Only the dialog on top answers (one opened from another stays open under it).
      const open = document.querySelectorAll('[role="dialog"], [role="alertdialog"]')
      if (open.length && open[open.length - 1] !== panel) return
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault()
        firstItem.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      back?.focus?.()
    }
  }, [isOpen, title, ariaLabel, labelledBy, titleId])

  if (typeof document === 'undefined') return null

  const fade = { duration: reduce ? 0 : 0.2 }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center ${BACKDROPS[backdrop]} sm:p-4`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fade}
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            role={tone === 'danger' ? 'alertdialog' : 'dialog'}
            aria-modal="true"
            aria-label={title ? undefined : ariaLabel}
            aria-labelledby={title ? titleId : labelledBy}
            aria-describedby={hint ? hintId : undefined}
            tabIndex={-1}
            className={`relative w-full ${SIZES[size]} max-h-[92dvh] flex flex-col bg-bg-header text-text-main rounded-t-card sm:rounded-card ring-1 ring-ink/[0.08] shadow-2xl shadow-black/50 outline-none`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={T.cards.close}
                className="absolute top-3 right-3 z-10 w-9 h-9 inline-flex items-center justify-center rounded-button text-text-secondary hover:text-text-main hover:bg-ink/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                <IconX size={18} aria-hidden="true" />
              </button>
            )}

            {title && (
              <div className="flex items-start gap-3 px-6 pt-6 pr-14">
                {icon && (
                  <span
                    aria-hidden="true"
                    className={`w-10 h-10 shrink-0 rounded-control flex items-center justify-center ${tone === 'danger' ? 'bg-danger/15 text-danger' : 'bg-accent/15 text-accent'}`}
                  >
                    {icon}
                  </span>
                )}
                <div className="flex flex-col gap-1 min-w-0">
                  <h2 id={titleId} className="text-lg font-bold leading-tight">{title}</h2>
                  {hint && <p id={hintId} className="text-sm text-text-secondary">{hint}</p>}
                </div>
              </div>
            )}

            <div className={`flex flex-col overflow-y-auto px-6 ${title ? 'pt-5' : 'pt-6'} ${footer ? 'pb-5' : 'pb-6'} ${className}`}>{children}</div>

            {footer && (
              <div className="flex flex-wrap items-center justify-end gap-2 px-6 py-4 shadow-[inset_0_1px_0_rgb(var(--ink)/0.08)]">{footer}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
