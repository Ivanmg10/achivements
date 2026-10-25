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
import DesignCatalogPiece, { Panel, Specimen } from '../design-catalog-piece/DesignCatalogPiece'

/** What the site says back: notices, toasts, dialogs, menus, tooltips and the empty state. */
export default function DesignCatalogFeedback() {
  const [open, setOpen] = useState<'default' | 'danger' | null>(null)

  return (
    <>
      <DesignCatalogPiece id="notice">
        <Panel>
          <div className="grid gap-2 sm:grid-cols-2">
            <Notice tone="info">Your points are being calculated. You can keep using the site.</Notice>
            <Notice tone="success">Steam linked. You can see your games.</Notice>
            <Notice tone="warning" title="Your email is not confirmed" action={<Button size="sm" variant="secondary">Resend</Button>}>Check your inbox.</Notice>
            <Notice tone="danger">That could not be saved.</Notice>
          </div>
        </Panel>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="toast">
        <Panel>
          <Specimen name="notify.success / notify.error">
            <Button size="sm" variant="secondary" onClick={() => notify.success('Saved')}>Success toast</Button>
            <Button size="sm" variant="secondary" onClick={() => notify.error('Could not save')}>Error toast</Button>
          </Specimen>
        </Panel>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="modal">
        <Panel>
          <Specimen name="default and tone=&quot;danger&quot;">
            <Button size="sm" variant="secondary" onClick={() => setOpen('default')}>Open a modal</Button>
            <Button size="sm" variant="danger" onClick={() => setOpen('danger')}>Open a danger modal</Button>
          </Specimen>
        </Panel>
        <Modal isOpen={open === 'default'} onClose={() => setOpen(null)} title="A modal" hint="Escape and a click outside close it; focus stays inside." size="sm">
          <p className="text-sm text-text-secondary">A dialog on the page, a sheet on a phone.</p>
        </Modal>
        <Modal
          isOpen={open === 'danger'}
          onClose={() => setOpen(null)}
          tone="danger"
          title="Delete it?"
          hint="It cannot be undone."
          size="sm"
          footer={<><Button variant="secondary" size="sm" onClick={() => setOpen(null)}>Cancel</Button><Button variant="danger" size="sm" onClick={() => setOpen(null)}>Delete</Button></>}
        >
          <p className="text-sm text-text-secondary">A confirmation that destroys something is an alert dialog.</p>
        </Modal>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="menu">
        <Panel>
          <div className="flex flex-wrap items-start gap-8">
            <Specimen name="MENU_SURFACE · menuItemClass">
              <div className={`${MENU_SURFACE} w-48`}>
                <span className={menuItemClass(true)}>Pin to home</span>
                <span className={menuItemClass()}>Add to a group</span>
              </div>
            </Specimen>
            <Specimen name="TOOLTIP_SURFACE"><span className={`${TOOLTIP_SURFACE} px-2.5 py-1.5 text-xs`}>Pin to home</span></Specimen>
          </div>
        </Panel>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="empty">
        <Panel><EmptyState icon={<IconInbox className="w-6 h-6" />} title="Nothing here yet" subtitle="An empty state says what is missing and what to do." size="compact" /></Panel>
      </DesignCatalogPiece>
    </>
  )
}
