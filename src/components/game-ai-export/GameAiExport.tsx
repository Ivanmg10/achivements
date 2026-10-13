'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { IconSparkles } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { AiExportSource } from '@/utils/aiExport'
import GameAiExportDialog from './game-ai-export-dialog/GameAiExportDialog'

/**
 * "Ask an AI" beside a game's links: a window that turns the game's
 * achievements into something a chat AI can work from (see utils/aiExport),
 * with an optional question of the player's, to download as .json or copy
 * and paste. Rendered once the achievements are there; `getSource` is only
 * called when the window opens, so a page does not build the export on every
 * render for nobody.
 */
export default function GameAiExport({ getSource }: { getSource: () => AiExportSource }) {
  const { T } = useLanguage()
  const [source, setSource] = useState<AiExportSource | null>(null)

  return (
    <>
      <button
        type="button"
        onClick={() => setSource(getSource())}
        aria-haspopup="dialog"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/15 hover:bg-accent/25 text-text-main text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        <IconSparkles className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
        {T.aiExport.open}
      </button>
      <AnimatePresence>{source && <GameAiExportDialog source={source} onClose={() => setSource(null)} />}</AnimatePresence>
    </>
  )
}
