'use client'

import { useState, useEffect } from 'react'
import { IconHash, IconCopy, IconCheck } from '@tabler/icons-react'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { useLanguage } from '@/context/LanguageContext'
import Modal from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { plural } from '@/utils/utils'

type GameHash = {
  MD5: string
  Name: string
  Labels: string[]
  PatchUrl: string | null
}

type Props = {
  isOpen: boolean
  onClose: () => void
  gameId: number
  gameTitle: string
}

const LABEL_COLORS: Record<string, string> = {
  REDUMP: 'bg-redump/20 text-redump-ink border-redump/30',
  'NO-INTRO': 'bg-success/20 text-success border-success/30',
  TOSEC: 'bg-tosec/20 text-tosec-ink border-tosec/30',
  'NOINTRO': 'bg-success/20 text-success border-success/30',
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded-box-sm text-text-secondary hover:text-text-main transition-colors shrink-0"
      aria-label={label}
    >
      {copied
        ? <IconCheck className="w-3.5 h-3.5 text-success" />
        : <IconCopy className="w-3.5 h-3.5" />
      }
    </button>
  )
}

export default function GameHashesModal({ isOpen, onClose, gameId, gameTitle }: Props) {
  const [hashes, setHashes] = useState<GameHash[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const { T, lang } = useLanguage()

  // Opening (or another game) starts the load over; state, so while rendering. The fetch is the effect.
  useWhenChanged([isOpen, gameId], () => {
    if (isOpen) {
      setLoading(true)
      setError(false)
    }
  })

  useEffect(() => {
    if (!isOpen) return
    // Closing, or another game, before the answer arrives must not let it land.
    let current = true
    fetch(`/api/getGameHashes?gameId=${gameId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load hashes')
        return r.json()
      })
      .then((data) => { if (current) setHashes(data.Results ?? []) })
      .catch(() => { if (current) { setHashes([]); setError(true) } })
      .finally(() => { if (current) setLoading(false) })
    return () => {
      current = false
    }
  }, [isOpen, gameId])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" icon={<IconHash size={20} />} title={T.gameInfoPage.hashesCompatible} hint={gameTitle}>
      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-bg-main rounded-tile p-4 flex flex-col gap-2">
              <Skeleton className="h-3 w-48 max-w-full" />
              <Skeleton className="h-2.5 w-64 max-w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
          <p className="text-sm text-danger" role="alert">{T.gameInfoPage.hashesLoadError}</p>
        </div>
      ) : hashes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
          <IconHash className="w-8 h-8 text-text-secondary opacity-30" />
          <p className="text-sm text-text-secondary">{T.gameInfoPage.hashesNone}</p>
          <p className="text-xs text-text-secondary">{T.gameInfoPage.hashesNoneHint}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-text-secondary">
            {plural(hashes.length, T.plurals.hashes, lang)}
          </p>
          {hashes.map((h) => (
            <div key={h.MD5} className="bg-bg-main rounded-tile p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-text-main leading-relaxed wrap-break-word min-w-0">{h.Name}</p>
                {h.Labels.length > 0 && (
                  <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                    {h.Labels.map((label) => (
                      <span
                        key={label}
                        className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-tag-sm border font-semibold ${LABEL_COLORS[label] ?? 'bg-ink/10 text-text-secondary border-ink/10'}`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 bg-bg-card rounded-box px-2.5 py-1.5">
                <code className="text-[11px] text-text-secondary font-mono flex-1 select-all">{h.MD5}</code>
                <CopyButton text={h.MD5} label={T.gameInfoPage.hashesCopy} />
              </div>
              {h.PatchUrl && (
                <a
                  href={h.PatchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-accent hover:underline self-start"
                >
                  {T.gameInfoPage.hashesPatch}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
