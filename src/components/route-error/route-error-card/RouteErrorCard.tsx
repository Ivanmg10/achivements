'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { ProgressBar } from '@/components/ui/ProgressBar'

/**
 * The error as an unlock cut short: a bar stopped halfway, in the theme's
 * colour, and the error's code (Next's digest, never its message) for the
 * person to copy when they report it.
 */
export default function RouteErrorCard({ digest }: { digest?: string }) {
  const { T } = useLanguage()
  const [copy, setCopy] = useState<'idle' | 'copied' | 'failed'>('idle')

  const handleCopy = () => {
    if (!digest) return
    Promise.resolve()
      .then(() => navigator.clipboard.writeText(digest))
      .then(
        () => setCopy('copied'),
        () => setCopy('failed'),
      )
  }

  return (
    <div className="w-full max-w-[360px] flex flex-col gap-2 px-4 py-3.5 rounded-2xl bg-bg-card ring-1 ring-ink/10 text-left text-xs text-text-secondary">
      <div className="flex justify-between gap-3">
        <span>{T.errorBoundary.load}</span>
        <span className="font-semibold text-danger">{T.errorBoundary.interrupted}</span>
      </div>
      <span aria-hidden="true" className="block">
        <ProgressBar pct={62} label={T.errorBoundary.load} />
      </span>
      {digest && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span>{T.errorBoundary.code}</span>
          <span className="flex items-center gap-2">
            <code className="font-mono text-text-main bg-ink/5 px-1.5 py-0.5 rounded-md select-all">{digest}</code>
            <button
              type="button"
              onClick={handleCopy}
              className="font-medium text-accent hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              {T.errorBoundary.copy}
            </button>
          </span>
          <span role="status" className={`w-full text-right ${copy === 'failed' ? 'text-danger' : 'text-success'}`}>
            {copy === 'copied' ? T.errorBoundary.copied : copy === 'failed' ? T.errorBoundary.copyFailed : ''}
          </span>
        </div>
      )}
    </div>
  )
}
