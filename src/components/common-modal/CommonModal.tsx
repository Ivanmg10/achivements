'use client'

import Modal, { type ModalProps } from '@/components/ui/Modal'

/**
 * The older modal API, now the library's `Modal`: same props, so the modals
 * built on it get the dialog's role, Escape, focus kept inside, the sheet on a
 * phone and the close in the corner. New code uses `Modal` directly.
 */
export default function CommonModal({ className = '', ...props }: Omit<ModalProps, 'className'> & { className?: string }) {
  return <Modal {...props} className={`gap-5 ${className}`} />
}
