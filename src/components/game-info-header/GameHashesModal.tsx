'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { IconX, IconHash, IconCopy, IconCheck } from '@tabler/icons-react'

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

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}
const contentVariants: Variants = {
  hidden: { opacity: 0, y: -14, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.15 } },
}

const LABEL_COLORS: Record<string, string> = {
  REDUMP: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'NO-INTRO': 'bg-green-500/20 text-green-300 border-green-500/30',
  TOSEC: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'NOINTRO': 'bg-green-500/20 text-green-300 border-green-500/30',
}

function CopyButton({ text }: { text: string }) {
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
      className="p-1 rounded text-text-secondary hover:text-text-main transition-colors shrink-0"
      aria-label="Copy hash"
    >
      {copied
        ? <IconCheck className="w-3.5 h-3.5 text-green-400" />
        : <IconCopy className="w-3.5 h-3.5" />
      }
    </button>
  )
}

export default function GameHashesModal({ isOpen, onClose, gameId, gameTitle }: Props) {
  const [hashes, setHashes] = useState<GameHash[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch(`/api/getGameHashes?gameId=${gameId}`)
      .then((r) => r.json())
      .then((data) => setHashes(data.Results ?? []))
      .catch(() => setHashes([]))
      .finally(() => setLoading(false))
  }, [isOpen, gameId])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative bg-bg-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-5 border-b border-white/8 shrink-0">
              <div className="w-9 h-9 rounded-lg bg-bg-main flex items-center justify-center shrink-0">
                <IconHash className="w-4.5 h-4.5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">Hashes compatibles</p>
                <p className="text-xs text-text-secondary truncate">{gameTitle}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/8 text-text-secondary hover:text-text-main transition-colors"
                aria-label="Cerrar"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-5">
              {loading ? (
                <div className="flex flex-col gap-3 animate-pulse">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="bg-bg-main rounded-xl p-4 flex flex-col gap-2">
                      <div className="h-3 w-48 rounded bg-white/10" />
                      <div className="h-2.5 w-64 rounded bg-white/10" />
                    </div>
                  ))}
                </div>
              ) : hashes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                  <IconHash className="w-8 h-8 text-text-secondary opacity-30" />
                  <p className="text-sm text-text-secondary">Sin hashes registrados</p>
                  <p className="text-xs text-text-secondary/60">No hay ROMs verificadas para este juego</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-text-secondary">
                    {hashes.length} {hashes.length === 1 ? 'hash registrado' : 'hashes registrados'}
                  </p>
                  {hashes.map((h) => (
                    <div key={h.MD5} className="bg-bg-main rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-text-main leading-relaxed wrap-break-word min-w-0">{h.Name}</p>
                        {h.Labels.length > 0 && (
                          <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                            {h.Labels.map((label) => (
                              <span
                                key={label}
                                className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border font-semibold ${LABEL_COLORS[label] ?? 'bg-white/10 text-text-secondary border-white/10'}`}
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 bg-bg-card rounded-lg px-2.5 py-1.5">
                        <code className="text-[11px] text-text-secondary/80 font-mono flex-1 select-all">{h.MD5}</code>
                        <CopyButton text={h.MD5} />
                      </div>
                      {h.PatchUrl && (
                        <a
                          href={h.PatchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-accent hover:underline self-start"
                        >
                          Descargar parche
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
