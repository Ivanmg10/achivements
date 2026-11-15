'use client'

import { useEffect, useState } from 'react'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'
import Button from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

/** The code to paste, in a box you can select, with its copy button. `code` null is the code on its way: the same box, in a skeleton. */
export default function PsnVerificationCode({ code }: { code: string | null }) {
  const { T } = useLanguage()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = () => {
    if (!code) return
    navigator.clipboard.writeText(code).then(
      () => setCopied(true),
      (err) => {
        console.error('[PsnVerificationCode] copy', err)
        notify.error(T.errorBoundary.copyFailed)
      },
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex-1 min-w-36 h-(--h-control) rounded-field bg-bg-main ring-1 ring-inset ring-ink/15 px-3 flex items-center">
        {code ? (
          <code aria-label={T.psn.verification.codeLabel} className="font-mono font-bold tracking-wider select-all">{code}</code>
        ) : (
          <Skeleton className="h-4 w-32" />
        )}
      </span>
      <Button variant="secondary" disabled={!code} onClick={copy}>
        {copied ? <IconCheck size={16} aria-hidden="true" /> : <IconCopy size={16} aria-hidden="true" />}
        {copied ? T.psn.verification.copied : T.psn.verification.copy}
      </Button>
      <span role="status" className="sr-only">{copied ? T.psn.verification.copied : ''}</span>
    </div>
  )
}
