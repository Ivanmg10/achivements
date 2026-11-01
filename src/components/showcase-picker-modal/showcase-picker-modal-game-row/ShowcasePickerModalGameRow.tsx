'use client'

import Image from 'next/image'
import { IconChevronRight, IconDeviceGamepad2 } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { PLATFORM_NAME } from '@/utils/gameRef'
import type { LibraryGame } from '@/utils/library'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'

/**
 * A game in the showcase picker: opens its achievements. While some of them
 * are selected it stands out (a ring in the accent and how many), so the
 * selection can be found again after moving to another game.
 */
export default function ShowcasePickerModalGameRow({ game, selected, onOpen }: { game: LibraryGame; selected: number; onOpen: () => void }) {
  const { T } = useLanguage()
  const on = selected > 0

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-tile text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
        on ? 'bg-accent/10 ring-1 ring-accent/60' : 'hover:bg-bg-card'
      }`}
    >
      {game.iconUrl ? (
        <Image src={game.iconUrl} alt="" width={40} height={40} className="w-10 h-10 rounded-box object-cover shrink-0" unoptimized />
      ) : (
        <span aria-hidden="true" className="w-10 h-10 rounded-box bg-ink/10 flex items-center justify-center text-text-secondary shrink-0">
          <IconDeviceGamepad2 size={18} />
        </span>
      )}
      <span className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium truncate">{game.title}</span>
        <span className="flex items-center gap-1.5 text-xs text-text-secondary min-w-0">
          <PlatformLogo source={game.source} size={10} label={PLATFORM_NAME[game.source]} />
          <span className="truncate">{game.subtitle}</span>
          <span className="shrink-0 tabular-nums">· {game.pct}%</span>
        </span>
      </span>
      {on && (
        <span className="shrink-0 rounded-full bg-accent text-bg-main text-[11px] font-bold px-2 py-0.5 tabular-nums">
          {T.showcase.selected.replace('{n}', String(selected))}
        </span>
      )}
      <IconChevronRight size={16} className="text-text-secondary shrink-0" aria-hidden="true" />
    </button>
  )
}
