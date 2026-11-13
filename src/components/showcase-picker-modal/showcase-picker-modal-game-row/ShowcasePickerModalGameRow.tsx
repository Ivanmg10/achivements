'use client'

import Image from 'next/image'
import { IconChevronRight, IconDeviceGamepad2 } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { PLATFORM_NAME } from '@/utils/gameRef'
import type { LibraryGame } from '@/utils/library'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import Facts from '@/components/ui/Facts'

/**
 * A game in the showcase picker: opens its achievements, the full title (two lines at most), its platform and its
 * percentage. While some of its achievements are selected it stands out (a ring in the accent and how many), so
 * the selection can be found again after moving to another game; the one open is marked too.
 */
export default function ShowcasePickerModalGameRow({
  game,
  selected,
  current = false,
  onOpen,
}: {
  game: LibraryGame
  selected: number
  /** The game whose achievements are showing. */
  current?: boolean
  onOpen: () => void
}) {
  const { T } = useLanguage()
  const on = selected > 0

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-current={current ? 'true' : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-tile text-left transition-colors focus-ring ${
        on ? 'bg-accent/10 ring-1 ring-accent/60' : current ? 'bg-ink/[0.07]' : 'hover:bg-bg-card'
      }`}
    >
      {game.iconUrl ? (
        <Image src={game.iconUrl} alt="" width={40} height={40} className="w-10 h-10 rounded-box object-cover shrink-0" unoptimized />
      ) : (
        <span aria-hidden="true" className="w-10 h-10 rounded-box bg-ink/10 flex items-center justify-center text-text-secondary shrink-0">
          <IconDeviceGamepad2 size={18} />
        </span>
      )}
      <span className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="text-sm font-medium leading-snug line-clamp-2 wrap-break-word">{game.title}</span>
        <span className="flex items-center text-xs text-text-secondary min-w-0">
          <PlatformLogo source={game.source} size={10} className="mr-1.5" />
          <Facts items={[<span key="p" className="truncate">{PLATFORM_NAME[game.source]}</span>, <span key="n" className="shrink-0 tabular-nums">{game.pct}%</span>]} />
        </span>
      </span>
      {on && (
        <span className="shrink-0 rounded-full bg-accent text-bg-main text-[11px] font-bold px-2 py-0.5 tabular-nums">
          {T.showcase.selected.replace('{n}', String(selected))}
        </span>
      )}
      <IconChevronRight size={16} className="text-text-secondary shrink-0 lg:hidden" aria-hidden="true" />
    </button>
  )
}
