'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { GameHash } from '@/hooks/useGameHashes'
import Tag, { type TagTone } from '@/components/ui/Tag'
import GameHashesModalCopy from '../game-hashes-modal-copy/GameHashesModalCopy'

// How RA names the preservation projects that vouch for a hash, as people write them.
const LABELS: Record<string, { name: string; tone: TagTone }> = {
  REDUMP: { name: 'Redump', tone: 'info' },
  'NO-INTRO': { name: 'No-Intro', tone: 'success' },
  NOINTRO: { name: 'No-Intro', tone: 'success' },
  TOSEC: { name: 'TOSEC', tone: 'info' },
}

function labelOf(raw: string): { name: string; tone: TagTone } {
  const known = LABELS[raw.toUpperCase()]
  return known ?? { name: raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase(), tone: 'muted' }
}

/** One registered hash: the file's name, the projects that vouch for it, its MD5 with a copy button and the patch. */
export default function GameHashesModalCard({ hash: h }: { hash: GameHash }) {
  const { T } = useLanguage()
  return (
    <div className="bg-bg-main rounded-tile p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-text-main leading-relaxed wrap-break-word min-w-0">{h.Name}</p>
        {h.Labels.length > 0 && (
          <div className="flex gap-1 shrink-0 flex-wrap justify-end">
            {h.Labels.map((label) => {
              const { name, tone } = labelOf(label)
              return <Tag key={label} tone={tone} size="xs">{name}</Tag>
            })}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 bg-bg-card rounded-box px-2.5 py-1.5">
        <code className="text-[11px] text-text-secondary font-mono flex-1 select-all">{h.MD5}</code>
        <GameHashesModalCopy text={h.MD5} />
      </div>
      {h.PatchUrl && (
        <a
          href={h.PatchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent hover:underline self-start rounded focus-ring"
        >
          {T.gameInfoPage.hashesPatch}
        </a>
      )}
    </div>
  )
}
