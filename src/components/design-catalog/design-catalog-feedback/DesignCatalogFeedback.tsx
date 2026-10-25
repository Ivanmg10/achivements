'use client'

import { useState } from 'react'
import { IconInbox } from '@tabler/icons-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Notice from '@/components/ui/Notice'
import { notify } from '@/lib/notify'
import { TOOLTIP_SURFACE } from '@/components/ui/tooltip'
import { MENU_SURFACE, menuItemClass } from '@/components/ui/menu'
import EmptyState from '@/components/empty-state/EmptyState'
import DesignCatalogSection, { Specimen } from '../design-catalog-section/DesignCatalogSection'

/** What the site says back: notices, toasts, dialogs, menus, tooltips and the empty state. */
export default function DesignCatalogFeedback() {
  const [open, setOpen] = useState(false)

  return (
    <DesignCatalogSection id="feedback" title="Feedback and overlays" hint="Notice (tinted, with its icon; an error is announced), toasts through notify, Modal, MENU_SURFACE, TOOLTIP_SURFACE, EmptyState.">
      <div className="grid gap-2 sm:grid-cols-2">
        <Notice tone="info">Your points are being calculated. You can keep using the site.</Notice>
        <Notice tone="success">Steam linked. You can see your games.</Notice>
        <Notice tone="warning" title="Your email is not confirmed" action={<Button size="sm" variant="secondary">Resend</Button>}>Check your inbox.</Notice>
        <Notice tone="danger">That could not be saved.</Notice>
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <Specimen name="notify">
          <Button size="sm" variant="secondary" onClick={() => notify.success('Saved')}>Success toast</Button>
          <Button size="sm" variant="secondary" onClick={() => notify.error('Could not save')}>Error toast</Button>
        </Specimen>
        <Specimen name="Modal">
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>Open a modal</Button>
        </Specimen>
        <Specimen name="MENU_SURFACE">
          <div className={`${MENU_SURFACE} w-44`}>
            <span className={menuItemClass(true)}>Pin to home</span>
            <span className={menuItemClass()}>Add to a group</span>
          </div>
        </Specimen>
        <Specimen name="TOOLTIP_SURFACE"><span className={`${TOOLTIP_SURFACE} px-2.5 py-1.5 text-xs`}>Pin to home</span></Specimen>
      </div>
      <EmptyState icon={<IconInbox className="w-6 h-6" />} title="Nothing here yet" subtitle="An empty state says what is missing and what to do." size="compact" />
      <Modal isOpen={open} onClose={() => setOpen(false)} title="A modal" hint="Escape and a click outside close it; focus stays inside." size="sm">
        <p className="text-sm text-text-secondary">A dialog on the page, a sheet on a phone.</p>
      </Modal>
    </DesignCatalogSection>
  )
}
