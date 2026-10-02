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
    <section className="bg-bg-card rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center gap-4 border border-red-500/20">
      <div className="flex-1 flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider">{T.deleteAccount.title}</h2>
        <p className="text-sm text-text-secondary">{T.deleteAccount.text}</p>
      </div>
      <button
        onClick={() => setOpen(true)}
        className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/40 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
      >
        <IconTrash size={16} aria-hidden="true" />
        {T.deleteAccount.button}
      </button>
      <DeleteAccountModal isOpen={open} onClose={() => setOpen(false)} />
    </section>
  )
}
