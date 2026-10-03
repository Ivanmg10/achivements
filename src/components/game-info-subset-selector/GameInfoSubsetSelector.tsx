import Link from 'next/link'
import { FadeImage } from '@/components/ui/FadeImage'
import { SubsetGame } from '@/types/types'

function extractSubsetLabel(title: string): string {
  const match = title.match(/\[Subset\s*-\s*(.+?)\]/)
  return match ? match[1] : title
}

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
  if (isLoading) {
    return (
      <div aria-hidden="true" className="flex gap-2 mt-3 animate-pulse motion-reduce:animate-none">
        <span className="w-12 h-12 rounded-lg bg-ink/[0.07]" />
        <span className="w-12 h-12 rounded-lg bg-ink/[0.05]" />
      </div>
    )
  }
  if (subsets.length === 0 && parentId === null) return null

  const tabs = [
    { id: parentId ?? currentId, label: 'Main Game', icon: parentIcon },
    ...subsets.map((s) => ({ id: s.ID, label: extractSubsetLabel(s.Title), icon: s.ImageIcon })),
  ]

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {tabs.map((tab) => {
        const isActive = tab.id === currentId
        return (
          <Link
            key={tab.id}
            href={`/gameInfo/${tab.id}`}
            title={tab.label}
            className={`relative shrink-0 rounded-lg overflow-hidden transition-all duration-150 ${
              isActive
                ? 'ring-2 ring-ink/60 scale-105'
                : 'opacity-50 hover:opacity-100 hover:ring-2 hover:ring-ink/30'
            }`}
          >
            {tab.icon ? (
              <FadeImage src={`https://retroachievements.org${tab.icon}`} alt={tab.label} width={48} height={48} className="w-12 h-12" />
            ) : (
              <span aria-hidden="true" className="block w-12 h-12 bg-ink/[0.06]" />
            )}
          </Link>
        )
      })}
    </div>
  )
}
