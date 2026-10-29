'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence } from 'framer-motion'
import { IconX } from '@tabler/icons-react'
import AdminPanel, { AdminPanelMode } from '@/components/admin-panel/AdminPanel'
import Modal from '@/components/ui/Modal'

/**
 * The admin panel, opened from the account card instead of sitting at the
 * bottom of the page. Wide on desktop, a sheet from the bottom on a phone.
 * Rendered in a portal on <body>, so the panel's own modals (create, edit,
 * delete) open over it rather than inside its animated box.
 *
 * Escape closes it only when it is the top dialog (the library's Modal sees to it):
 * with an edit modal open over it, Escape must not throw the edit away.
 * Admin panel copy is English only, like the rest of the panel.
 */
export default function AdminPanelModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // Narrow while it is only the password door, wide once there are users to show.
  const [mode, setMode] = useState<AdminPanelMode>('loading')

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose} size={mode === 'open' ? 'xl' : 'sm'} showClose={false} aria-label="Admin panel" className="gap-4">
            <AdminPanel
              onModeChange={setMode}
              headerEnd={
                <button
                  onClick={onClose}
                  aria-label="Close admin panel"
                  className="p-2 rounded-tile text-text-secondary hover:text-text-main hover:bg-ink/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                >
                  <IconX size={18} aria-hidden="true" />
                </button>
              }
            />
          </Modal>
      )}
    </AnimatePresence>,
    document.body,
  )
}
