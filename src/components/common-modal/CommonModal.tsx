'use client'

import Modal, { type ModalProps } from '@/components/ui/Modal'

/**
 * The older modal API, now the library's `Modal`: same props, so the modals
 * built on it get the dialog's role, Escape, focus kept inside, the sheet on a
 * phone and, if asked, the close in the corner. New code uses `Modal` directly.
 */
export default function CommonModal({ className = '', showClose = false, ...props }: Omit<ModalProps, 'className'> & { className?: string }) {
  // Off by default here: these modals carry their own way out.
  return <Modal {...props} showClose={showClose} className={`gap-5 ${className}`} />
}
