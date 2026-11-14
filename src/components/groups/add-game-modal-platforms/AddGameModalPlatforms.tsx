import { useLanguage } from '@/context/LanguageContext'
import { useScrollFade } from '@/hooks/useScrollFade'
import { PLATFORM_NAME } from '@/utils/gameRef'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import { pillClass } from '@/components/ui/Pill'
import type { GameSource } from '@/types/game'

/** All platforms, or one, among those the user has games on; the current one pressed. One row that scrolls sideways with a fade where it is cut, never a second row. */
export default function AddGameModalPlatforms({
  sources,
  value,
  onChange,
}: {
  sources: GameSource[]
  value: GameSource | null
  onChange: (source: GameSource | null) => void
}) {
  const { T } = useLanguage()
  const { ref, fade } = useScrollFade()
  const options: (GameSource | null)[] = [null, ...sources]

  return (
    <div ref={ref} role="group" aria-label={T.groups.filterConsoleLabel} className={`flex gap-1.5 overflow-x-auto min-w-0 [scrollbar-width:none] ${fade}`}>
      {options.map((s) => (
        <button
          key={s ?? 'all'}
          type="button"
          aria-pressed={value === s}
          onClick={() => onChange(s)}
          className={pillClass(value === s)}
        >
          {s && <PlatformLogo source={s} size={11} />}
          {s ? PLATFORM_NAME[s] : T.groups.filterAll}
        </button>
      ))}
    </div>
  )
}
