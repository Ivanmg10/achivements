import { useLanguage } from '@/context/LanguageContext'
import type { GameSource } from '@/types/steam'
import { PLATFORM_NAME } from '@/utils/gameRef'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import { pillClass } from '@/components/ui/Pill'

/** All platforms, or one, among those the user has games on; the current one pressed. */
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
  const options: (GameSource | null)[] = [null, ...sources]

  return (
    <div role="group" aria-label={T.groups.filterConsoleLabel} className="flex flex-wrap gap-1.5">
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
