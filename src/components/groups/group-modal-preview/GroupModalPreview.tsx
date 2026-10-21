import Image from 'next/image'
import { IconLock, IconWorld } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { candidateIconUrl, type GameCandidate } from '@/utils/gameCandidates'
import { plural } from '@/utils/utils'
import GroupIconDisplay from '@/components/groups/group-icon-display/GroupIconDisplay'

/**
 * How the group will look as it is being made: the chosen games' covers behind,
 * its icon, its name (or the placeholder) and its privacy. Decorative copy of
 * the form, so hidden from screen readers.
 */
export default function GroupModalPreview({ title, icon, isPublic, games }: { title: string; icon: string; isPublic: boolean; games: GameCandidate[] }) {
  const { T, lang } = useLanguage()
  const covers = games.map(candidateIconUrl).filter(Boolean).slice(0, 4)
  const Privacy = isPublic ? IconWorld : IconLock

  return (
    <div aria-hidden="true" className="relative h-28 rounded-2xl overflow-hidden bg-bg-main ring-1 ring-ink/5 shrink-0">
      {covers.length > 0 && (
        <div className="absolute inset-0 grid opacity-35" style={{ gridTemplateColumns: `repeat(${covers.length}, minmax(0, 1fr))` }}>
          {covers.map((src, i) => (
            <Image key={i} src={src} alt="" width={120} height={120} className="w-full h-full object-cover blur-[1px]" unoptimized />
          ))}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-bg-main/70 to-transparent" />
      <div className="absolute inset-x-4 bottom-3 flex items-end gap-3">
        <span className="w-12 h-12 rounded-xl bg-bg-card ring-1 ring-ink/10 flex items-center justify-center overflow-hidden shrink-0 [&>span]:text-2xl [&>img]:w-full [&>img]:h-full">
          <GroupIconDisplay icon={icon.trim() || null} />
        </span>
        <div className="min-w-0">
          <p className={`text-lg font-bold truncate ${title.trim() ? 'text-text-main' : 'text-text-secondary'}`}>{title.trim() || T.groups.groupTitlePlaceholder}</p>
          <p className="flex items-center gap-1 text-xs text-text-secondary">
            {plural(games.length, T.plurals.games, lang)} ·
            <Privacy className="w-3 h-3" />
            {isPublic ? T.groups.public : T.groups.private}
          </p>
        </div>
      </div>
    </div>
  )
}
