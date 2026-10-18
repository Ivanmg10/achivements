import { useLanguage } from '@/context/LanguageContext'
import { ProgressBar } from '@/components/ui/ProgressBar'

/** The 404 as an achievement card: 0 of 1, and no one has it. */
export default function NotFoundProgress() {
  const { T } = useLanguage()

  return (
    <div className="w-full max-w-[360px] flex flex-col gap-2 px-4 py-3.5 rounded-2xl bg-bg-card ring-1 ring-ink/10 text-left text-xs text-text-secondary tabular-nums">
      <div className="flex justify-between gap-3">
        <span>{T.notFound.progress}</span>
        <span className="font-semibold text-text-main">0 / 1</span>
      </div>
      <ProgressBar pct={0} label={T.notFound.progress} />
      <div className="flex justify-between gap-3">
        <span>{T.notFound.rarity}</span>
        <span>{T.notFound.rarityValue}</span>
      </div>
    </div>
  )
}
