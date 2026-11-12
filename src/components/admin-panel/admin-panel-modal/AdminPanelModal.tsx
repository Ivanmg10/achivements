'use client'

import { useState } from 'react'
import { IconLock, IconShield } from '@tabler/icons-react'
import AdminPanel, { AdminPanelMode } from '@/components/admin-panel/AdminPanel'
import Modal from '@/components/ui/Modal'

/**
 * The admin panel, opened from the account card instead of sitting at the
 * bottom of the page. Wide on desktop, a sheet from the bottom on a phone.
 * The panel's own modals (create, edit, delete) open over it.
 *
 * Escape closes it only when it is the top dialog (the library's Modal sees to it):
 * with an edit modal open over it, Escape must not throw the edit away.
 * The head is the one title of the step: "Unlock the admin panel" with the lock while the door is
 * shut, "Admin panel" with the shield once it is open (#132).
 * Admin panel copy is English only, like the rest of the panel.
 */
export default function AdminPanelModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // Narrow while it is only the password door, wide once there are users to show.
  const [mode, setMode] = useState<AdminPanelMode>('loading')

  const locked = mode === 'locked'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={mode === 'open' ? 'xl' : 'sm'}
      icon={locked ? <IconLock size={20} /> : <IconShield size={20} />}
      title={locked ? 'Unlock the admin panel' : 'Admin panel'}
    >
      <AdminPanel onModeChange={setMode} />
    </Modal>
  )
}
