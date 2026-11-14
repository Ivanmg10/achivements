import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

const SIZES = { sm: 'sm:max-w-[27.5rem]', md: 'sm:max-w-[33.75rem]', lg: 'sm:max-w-[47.5rem]', xl: 'sm:max-w-5xl', '2xl': 'sm:max-w-[77.5rem]' } as const
// Below `sm` a big dialog (a detail, a picker, a tool) takes the whole screen; a confirmation stays a sheet from the bottom.
const FULL_ON_PHONE = new Set<keyof typeof SIZES>(['lg', 'xl', '2xl'])
const BACKDROPS = { default: 'bg-black/60 backdrop-blur-[2px]', opaque: 'bg-black/80 backdrop-blur-sm', dim: 'bg-black/60' } as const
// center: a card in the middle from sm, a sheet from the bottom on a phone. top: a panel near the top on
// every screen, for a command panel or a menu (the search, the phone menu).
const PLACEMENTS = {
  center: { overlay: 'items-end sm:items-center sm:p-4', panel: 'max-h-[92dvh] sm:max-h-[85dvh] rounded-t-card sm:rounded-card', from: 24, to: 16 },
  top: { overlay: 'items-start px-4 pt-[12vh]', panel: 'max-h-[80dvh] rounded-sheet', from: -14, to: -8 },
} as const
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export type ModalProps = {
  isOpen: boolean
  onClose: () => void
  /** Optional: a confirmation can be only its head (title, hint) and footer. */
  children?: React.ReactNode
  /** The head: a title (it names the dialog), a line under it and an icon in a tile. */
  title?: React.ReactNode
  hint?: React.ReactNode
  icon?: React.ReactNode
  /** Its own row under a hairline: the actions. */
  footer?: React.ReactNode
  /** A bar that stays put between the head and the scrolling body, outside the scroll box: a picker's search and filters. On a `short:` screen the panel scrolls as a whole instead (head, toolbar and list together, the footer stuck at the bottom), so the list is not left with 30 px. Never a `sticky` bar inside the body (the content shows through above it). */
  toolbar?: React.ReactNode
  size?: keyof typeof SIZES
  /** A confirmation that destroys something: `alertdialog`, the icon in the danger colour. */
  tone?: 'default' | 'danger'
  /** How much of the page behind shows through; `opaque` is for an immersive chooser, `dim` has no blur, for a dialog whose page takes part in a view transition (Firefox drops the blur from its capture). */
  backdrop?: keyof typeof BACKDROPS
  /** Where it opens: `top` for a command panel or a menu. */
  placement?: keyof typeof PLACEMENTS
  /** The quiet ✕ in the corner; on unless the content has its own way out. */
  showClose?: boolean
  /** No padding round the body: a command panel or a menu whose rows reach the edges. */
  flush?: boolean
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
  toolbar,
  size = 'sm',
  tone = 'default',
  backdrop = 'default',
  placement = 'center',
  showClose = true,
  flush = false,
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
    // The dialog itself takes focus (its name is read first), unless a field with autoFocus already has it (React focused it on mount).
    if (panel && !panel.contains(document.activeElement)) (panel.querySelector<HTMLElement>('[autofocus]') ?? panel).focus()

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
  const place = PLACEMENTS[placement]

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 z-50 flex justify-center ${place.overlay} ${BACKDROPS[backdrop]}`}
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
            className={`relative w-full ${SIZES[size]} flex flex-col bg-bg-header text-text-main ${place.panel} ${toolbar ? 'short:overflow-y-auto' : ''} ${placement === 'center' && FULL_ON_PHONE.has(size) ? 'max-sm:h-dvh max-sm:max-h-dvh max-sm:rounded-none' : ''} ring-1 ring-ink/[0.08] shadow-2xl shadow-black/50 outline-none`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: place.from, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: place.to, scale: 0.98 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={T.cards.close}
                className="absolute top-3 right-3 z-10 w-9 h-9 inline-flex items-center justify-center rounded-button text-text-secondary hover:text-text-main hover:bg-ink/[0.08] transition-colors focus-ring"
              >
                <IconX size={18} aria-hidden="true" />
              </button>
            )}

            {title && (
              <div className={`flex items-start gap-3 px-6 pt-6 pr-14 ${children != null ? '' : 'pb-5'}`}>
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

            {toolbar && (
              <div className={`flex flex-col gap-3 px-6 pb-4 shadow-hairline-b ${title ? 'pt-4' : 'pt-6 pr-14'}`}>{toolbar}</div>
            )}

            {children != null && (
              <div className={`flex flex-col flex-1 min-h-0 overflow-y-auto ${toolbar ? 'short:flex-none short:overflow-visible' : ''} ${flush ? '' : `px-6 ${toolbar ? 'pt-4' : title ? 'pt-5' : 'pt-6'} ${footer ? 'pb-5' : 'pb-6'}`} ${className}`}>{children}</div>
            )}

            {footer && (
              <div className={`flex flex-wrap items-center justify-end gap-2 px-6 py-4 shadow-hairline-t ${toolbar ? 'short:sticky short:bottom-0 short:z-10 short:bg-bg-header' : ''}`}>{footer}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
