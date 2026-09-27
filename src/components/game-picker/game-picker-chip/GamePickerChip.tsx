'use client'

import Image from 'next/image'
import { IconX } from '@tabler/icons-react'
import { candidateIconUrl, GameCandidate } from '@/utils/gameCandidates'

/** A picked game waiting to be confirmed, with a button to drop it again. */
export default function GamePickerChip({
  candidate: c,
  removeLabel,
  onRemove,
}: {
  candidate: GameCandidate
  /** Accessible name of the remove button, e.g. "Remove Portal 2". */
  removeLabel: string
  onRemove: () => void
}) {
  const icon = candidateIconUrl(c)

  return (
    <span className="flex items-center gap-1.5 bg-accent/15 text-accent text-xs px-2.5 py-1 rounded-full">
      {icon && <Image src={icon} alt="" width={14} height={14} className="rounded shrink-0" unoptimized />}
      <span className="truncate max-w-32">{c.title}</span>
      <button onClick={onRemove} className="text-accent/60 hover:text-accent transition-colors ml-0.5" aria-label={removeLabel}>
        <IconX className="w-3 h-3" aria-hidden />
      </button>
    </span>
  )
}
