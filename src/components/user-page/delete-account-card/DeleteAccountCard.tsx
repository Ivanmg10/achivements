'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useLanguage } from '@/context/LanguageContext'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import Button from '@/components/ui/Button'

// Downloaded the first time it is wanted, not with the page.
const DeleteAccountModal = dynamic(() => import('@/components/delete-account-modal/DeleteAccountModal'), { loading: () => null })

/** The way out: the account and everything in it, gone for good. */
export default function DeleteAccountCard() {
  const { T } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <section className="bg-bg-card rounded-card p-5 sm:px-7 flex flex-col sm:flex-row sm:items-center gap-4 ring-1 ring-inset ring-danger/25 enter-card [--i:6]">
      <div className="flex-1 flex flex-col gap-1">
        <h2 className="font-bold text-danger">{T.deleteAccount.title}</h2>
        <p className="text-[0.8125rem] text-text-secondary">{T.deleteAccount.text}</p>
      </div>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)} aria-haspopup="dialog" className="self-start sm:self-auto">
        {T.deleteAccount.button}
      </Button>
      <LazyWhenOpened open={open}>
        <DeleteAccountModal isOpen={open} onClose={() => setOpen(false)} />
      </LazyWhenOpened>
    </section>
  )
}
