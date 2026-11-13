'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { IconLanguage } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { LANGUAGES } from '@/utils/languages'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import Button from '@/components/ui/Button'

// Downloaded the first time it is opened, not with the page.
const LanguageModal = dynamic(() => import('@/components/language-modal/LanguageModal'), { loading: () => null })

/**
 * A visitor's way to change the language before having an account: the one being shown, by its own name,
 * opens the app's language dialog. The page starts in the browser's language; this is for when that is wrong.
 */
export default function LandingLanguage() {
  const { T, lang } = useLanguage()
  const [open, setOpen] = useState(false)
  const shown = LANGUAGES.find((l) => l.id === lang)?.label

  return (
    <>
      <Button variant="quiet" size="sm" aria-label={`${T.userConfig.language}: ${shown}`} onClick={() => setOpen(true)}>
        <IconLanguage size={18} aria-hidden="true" />
        {shown}
      </Button>
      <LazyWhenOpened open={open}>
        <LanguageModal isOpen={open} onClose={() => setOpen(false)} />
      </LazyWhenOpened>
    </>
  )
}
