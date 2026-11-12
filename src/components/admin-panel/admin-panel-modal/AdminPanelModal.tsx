'use client'

import { useState } from 'react'
import { IconLock, IconShield } from '@tabler/icons-react'
import AdminPanel, { AdminPanelMode } from '@/components/admin-panel/AdminPanel'
import AdminUnlockSkeleton from '@/components/admin-panel/admin-unlock-skeleton/AdminUnlockSkeleton'
import Modal from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'

/**
 * The admin panel, opened from the account card instead of sitting at the
 * bottom of the page. Wide on desktop, a sheet from the bottom on a phone.
 * The panel's own modals (create, edit, delete) open over it.
 *
 * Escape closes it only when it is the top dialog (the library's Modal sees to it):
 * with an edit modal open over it, Escape must not throw the edit away.
 * The head is the one title of the step: "Unlock the admin panel" with the lock while the door is
 * shut, "Admin panel" with the shield once it is open (#132). Until the panel knows which, the head
 * claims neither (a title skeleton, an empty icon tile) and the body is the unlock step's skeleton,
 * the usual case, so only the words arrive and the dialog keeps its size.
 * Admin panel copy is English only, like the rest of the panel.
 */
export default function AdminPanelModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // Medium while it is only the password door (and while it is not known), wide once there are users to show.
  const [mode, setMode] = useState<AdminPanelMode>('loading')

  const waiting = mode === 'loading'
  const locked = mode === 'locked'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={mode === 'open' ? 'xl' : 'md'}
      icon={waiting ? <span className="size-5" /> : locked ? <IconLock size={20} /> : <IconShield size={20} />}
      title={
        waiting ? (
          <>
            <Skeleton className="h-[1lh] w-48" />
            <span className="sr-only">Loading…</span>
          </>
        ) : locked ? 'Unlock the admin panel' : 'Admin panel'
      }
    >
      {waiting && <AdminUnlockSkeleton />}
      {/* Mounted from the start: it is what asks the server and reports the mode. */}
      <div hidden={waiting}>
        <AdminPanel onModeChange={setMode} />
      </div>
    </Modal>
  )
}
