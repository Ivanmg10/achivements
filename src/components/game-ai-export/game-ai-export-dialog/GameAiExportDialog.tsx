'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { IconCopy, IconDownload, IconSparkles, IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { modalOverlay, modalContent } from '@/lib/animations'
import { aiExportFileName, aiExportText, buildAiExport, type AiExportSource } from '@/utils/aiExport'
import Button from '@/components/ui/Button'
import { fieldClass } from '@/components/ui/Input'

type CopyState = 'idle' | 'copied' | 'failed'

/**
 * The window behind "Ask an AI": what the file is for, an optional question
 * that goes into it, and the two ways out — copy the text to paste in a chat,
 * or download the .json to attach. Copying says how it went right here (the
 * window stays open), not in a toast. Rendered inside the caller's
 * AnimatePresence; focus moves in on open and back on close.
 */
export default function GameAiExportDialog({ source, onClose }: { source: AiExportSource; onClose: () => void }) {
  const { T, lang } = useLanguage()
  const [question, setQuestion] = useState('')
  const [copy, setCopy] = useState<CopyState>('idle')
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const questionId = useId()

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    return () => opener?.focus?.()
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const build = () => buildAiExport(source, { lang, question })

  function download() {
    const blob = new Blob([JSON.stringify(build(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = aiExportFileName(source.game.title, source.platform)
    a.click()
    URL.revokeObjectURL(url)
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(aiExportText(build()))
      setCopy('copied')
    } catch (err) {
      console.error('[GameAiExport] copy', err)
      setCopy('failed')
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      variants={modalOverlay}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-bg-main rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col gap-4 p-5 sm:p-6 focus:outline-none"
        variants={modalContent}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <IconSparkles className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />
            {T.aiExport.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={T.aiExport.close}
            className="p-1 rounded-lg text-text-secondary hover:text-text-main hover:bg-ink/10 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <IconX className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm text-text-secondary">{T.aiExport.intro.replace('{game}', source.game.title)}</p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={questionId} className="text-sm font-medium">
            {T.aiExport.questionLabel}
          </label>
          <textarea
            id={questionId}
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value)
              setCopy('idle')
            }}
            rows={3}
            maxLength={1000}
            placeholder={T.aiExport.questionPlaceholder}
            className={fieldClass({}, 'h-auto! py-2.5 text-sm resize-y')}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            onClick={copyText}
            className="flex-1"
          >
            <IconCopy className="w-4 h-4" aria-hidden="true" />
            {T.aiExport.copy}
          </Button>
          <button
            type="button"
            onClick={download}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ink/8 hover:bg-ink/12 text-text-main text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <IconDownload className="w-4 h-4" aria-hidden="true" />
            {T.aiExport.download}
          </button>
        </div>

        {copy === 'copied' && (
          <p role="status" className="text-sm text-success">
            {T.aiExport.copied}
          </p>
        )}
        {copy === 'failed' && (
          <p role="alert" className="text-sm text-danger">
            {T.aiExport.copyFailed}
          </p>
        )}

        <p className="text-xs text-text-secondary">{T.aiExport.howTo}</p>
        <p className="text-xs text-text-secondary">{T.aiExport.privacy}</p>
      </motion.div>
    </motion.div>
  )
}
