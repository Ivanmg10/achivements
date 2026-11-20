import { useId } from 'react'
import Link from 'next/link'
import { FadeImage } from '@/components/ui/FadeImage'
import { SubsetGame } from '@/types/types'
import { Skeleton } from '@/components/ui/Skeleton'
import Kicker from '@/components/ui/Kicker'
import { TabMark } from '@/components/ui/Tabs'
import { raImageUrl } from '@/utils/raAssets'
import { useLanguage } from '@/context/LanguageContext'

function extractSubsetLabel(title: string): string {
  const match = title.match(/\[Subset\s*-\s*(.+?)\]/)
  return match ? match[1] : title
}

/**
 * An RA game's achievement sets under its progress: the main game and each
 * subset, a link to its page, with a label over them and each set's name beside
 * its badge (#167: two bare badges said nothing). The one open carries the mark.
 */
export default function GameInfoSubsetSelector({
  currentId,
  parentId,
  parentIcon,
  subsets,
  isLoading = false,
}: {
  currentId: number
  parentId: number | null
  parentIcon: string
  subsets: SubsetGame[]
  /** While the subsets are looked up: hold the row's place, so the header does not jump when they arrive. */
  isLoading?: boolean
}) {
  const { T } = useLanguage()
  const labelId = useId()
  if (isLoading) {
    return (
      <div aria-hidden="true" className="flex flex-col gap-2 mt-3">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton radius="tile" className="h-11 w-36" />
          <Skeleton radius="tile" className="h-11 w-28" />
        </div>
      </div>
    )
  }
  if (subsets.length === 0 && parentId === null) return null

  const tabs = [
    { id: parentId ?? currentId, label: T.gameInfoPage.mainGame, icon: parentIcon },
    ...subsets.map((s) => ({ id: s.ID, label: extractSubsetLabel(s.Title), icon: s.ImageIcon })),
  ]

  return (
    <nav aria-labelledby={labelId} className="flex flex-col gap-2 mt-3">
      <Kicker id={labelId}>{T.gameInfoPage.achievementSets}</Kicker>
      <ul className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab.id === currentId
          return (
            <li key={tab.id}>
              <Link
                href={`/gameInfo/${tab.id}`}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2 h-11 pl-1 pr-3 rounded-tile text-sm font-semibold focus-ring transition-colors duration-(--motion-hover) ${
                  isActive ? 'bg-ink/[0.08] ring-1 ring-inset ring-ink/20 text-text-main' : 'text-text-secondary hover:text-text-main hover:bg-ink/[0.05]'
                }`}
              >
                {tab.icon ? (
                  <FadeImage src={raImageUrl(tab.icon)!} alt="" width={36} height={36} className="w-9 h-9 rounded-icon overflow-hidden shrink-0" />
                ) : (
                  <span aria-hidden="true" className="block w-9 h-9 rounded-icon bg-ink/[0.06] shrink-0" />
                )}
                <TabMark on={isActive} />
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
