'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { IconSparkles } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { AiExportSource } from '@/utils/aiExport'
import GameAiExportDialog from './game-ai-export-dialog/GameAiExportDialog'
import { buttonClass } from '@/components/ui/Button'

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
        className={buttonClass('primary', 'sm')}
      >
        <IconSparkles className="w-4 h-4" aria-hidden="true" />
        {T.aiExport.open}
      </button>
      <AnimatePresence>{source && <GameAiExportDialog source={source} onClose={() => setSource(null)} />}</AnimatePresence>
    </>
  )
}
