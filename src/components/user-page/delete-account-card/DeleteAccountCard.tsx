'use client'

import { useState } from 'react'
import { IconTrash } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import DeleteAccountModal from '@/components/delete-account-modal/DeleteAccountModal'

/** The way out: the account and everything in it, gone for good. */
export default function DeleteAccountCard() {
  const { T } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <section className="bg-bg-card rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center gap-4 border border-danger/20">
      <div className="flex-1 flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-danger uppercase tracking-wider">{T.deleteAccount.title}</h2>
        <p className="text-sm text-text-secondary">{T.deleteAccount.text}</p>
      </div>
      <button
        onClick={() => setOpen(true)}
        className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-danger/40 text-danger text-sm font-semibold hover:bg-danger/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/60"
      >
        <IconTrash size={16} aria-hidden="true" />
        {T.deleteAccount.button}
      </button>
      <DeleteAccountModal isOpen={open} onClose={() => setOpen(false)} />
    </section>
  )
}
