'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { IconX } from '@tabler/icons-react'
import AdminPanel, { AdminPanelMode } from '@/components/admin-panel/AdminPanel'
import { modalOverlay, modalContent } from '@/lib/animations'

/**
 * The admin panel, opened from the account card instead of sitting at the
 * bottom of the page. Wide on desktop, a sheet from the bottom on a phone.
 * Rendered in a portal on <body>, so the panel's own modals (create, edit,
 * delete) open over it rather than inside its animated box.
 *
 * Escape closes it only when it is the top dialog: with an edit modal open
 * over it, Escape must not throw the edit away by closing the panel.
 * Admin panel copy is English only, like the rest of the panel.
 */
export default function AdminPanelModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)
  // Narrow while it is only the password door, wide once there are users to show.
  const [mode, setMode] = useState<AdminPanelMode>('loading')
  const wide = mode === 'open'

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const dialogs = document.querySelectorAll('[role="dialog"]')
      if (dialogs[dialogs.length - 1] === dialogRef.current) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-6"
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            layout
            role="dialog"
            aria-modal="true"
            aria-label="Admin panel"
            className={`relative w-full ${wide ? 'max-w-6xl' : 'max-w-md'} max-h-[92dvh] sm:max-h-[85dvh] overflow-y-auto bg-bg-header text-text-main rounded-t-3xl sm:rounded-3xl ring-1 ring-white/10 shadow-2xl shadow-black/50 px-4 sm:px-6`}
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <AdminPanel
              onModeChange={setMode}
              headerEnd={
                <button
                  onClick={onClose}
                  aria-label="Close admin panel"
                  className="p-2 rounded-xl text-text-secondary hover:text-text-main hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                >
                  <IconX size={18} aria-hidden="true" />
                </button>
              }
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
