'use client'

import { useEffect, useState } from 'react'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import IconButton from '@/components/ui/IconButton'

/** Copies a hash; the check says it was done, and a screen reader hears "Copied" as well. */
export default function GameHashesModalCopy({ text }: { text: string }) {
  const { T } = useLanguage()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => setCopied(true), (err) => console.error('[GameHashes] copy', err))
  }

  return (
    <>
      <IconButton size="sm" onClick={handleCopy} aria-label={T.gameInfoPage.hashesCopy}>
        {copied ? <IconCheck className="w-3.5 h-3.5 text-success" aria-hidden="true" /> : <IconCopy className="w-3.5 h-3.5" aria-hidden="true" />}
      </IconButton>
      <span role="status" className="sr-only">{copied ? T.gameInfoPage.hashesCopied : ''}</span>
    </>
  )
}
