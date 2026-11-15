'use client'

import { useId, useState } from 'react'
import { IconCopy, IconDownload, IconSparkles } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { aiExportFileName, aiExportText, buildAiExport, type AiExportSource } from '@/utils/aiExport'
import Button from '@/components/ui/Button'
import { fieldClass } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'

type CopyState = 'idle' | 'copied' | 'failed'

/**
 * The window behind "Ask an AI": what the file is for, an optional question
 * that goes into it, and the two ways out — copy the text to paste in a chat,
 * or download the .json to attach. Copying says how it went right here (the
 * window stays open), not in a toast.
 */
export default function GameAiExportDialog({ source, onClose }: { source: AiExportSource; onClose: () => void }) {
  const { T, lang } = useLanguage()
  const [question, setQuestion] = useState('')
  const [copy, setCopy] = useState<CopyState>('idle')
  const questionId = useId()

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
    <Modal
      isOpen={true}
      onClose={onClose}
      size="md"
      icon={<IconSparkles size={20} />}
      title={T.aiExport.title}
      hint={T.aiExport.intro.replace('{game}', source.game.title)}
    >
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
            className={fieldClass({ multiline: true }, 'h-auto! py-2.5 text-sm [resize:var(--area-resize)]')}
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
          <Button type="button" variant="secondary" onClick={download} className="flex-1">
            <IconDownload className="w-4 h-4" aria-hidden="true" />
            {T.aiExport.download}
          </Button>
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
      </Modal>
  )
}
