'use client'

import { useState } from 'react'
import { IconShield } from '@tabler/icons-react'
import AdminPanel, { AdminPanelMode } from '@/components/admin-panel/AdminPanel'
import Modal from '@/components/ui/Modal'

/**
 * The admin panel, opened from the account card instead of sitting at the
 * bottom of the page. Wide on desktop, a sheet from the bottom on a phone.
 * The panel's own modals (create, edit, delete) open over it.
 *
 * Escape closes it only when it is the top dialog (the library's Modal sees to it):
 * with an edit modal open over it, Escape must not throw the edit away.
 * Admin panel copy is English only, like the rest of the panel.
 */
export default function AdminPanelModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // Narrow while it is only the password door, wide once there are users to show.
  const [mode, setMode] = useState<AdminPanelMode>('loading')

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={mode === 'open' ? 'xl' : 'sm'} icon={<IconShield size={20} />} title="Admin panel">
      <AdminPanel onModeChange={setMode} />
    </Modal>
  )
}
