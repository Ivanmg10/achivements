import Link from 'next/link'
import Image from 'next/image'
import { SubsetGame } from '@/types/types'

function extractSubsetLabel(title: string): string {
  const match = title.match(/\[Subset\s*-\s*(.+?)\]/)
  return match ? match[1] : title
}

export default function GameInfoSubsetSelector({
  currentId,
  parentId,
  parentTitle,
  parentIcon,
  subsets,
}: {
  currentId: number
  parentId: number | null
  parentTitle: string
  parentIcon: string
  subsets: SubsetGame[]
}) {
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
                ? 'ring-2 ring-white/60 scale-105'
                : 'opacity-50 hover:opacity-100 hover:ring-2 hover:ring-white/30'
            }`}
          >
            <Image
              src={`https://retroachievements.org${tab.icon}`}
              alt={tab.label}
              width={48}
              height={48}
              className="w-12 h-12 object-cover block"
            />
          </Link>
        )
      })}
    </div>
  )
}
