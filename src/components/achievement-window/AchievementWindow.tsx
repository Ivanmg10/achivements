'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import Modal from '@/components/ui/Modal'

// A row of figures fits the window: two at most across a phone, six from `sm`.
const COLUMNS = { 1: 'grid-cols-2', 2: 'grid-cols-2', 3: 'grid-cols-3', 6: 'grid-cols-3 sm:grid-cols-6' } as const

/**
 * The shell of one achievement's window, the same for every platform (docs/platform-shells.md): the Modal's own head
 * (the badge as its icon, the name, what it asks for), a row of marks under it, a row of `Figure` tiles, then the
 * platform's sections as children. RA's `AchievementModal` and Steam, PSN and Xbox's `AchievementDetailModal` are the
 * adapters: each brings its marks, its figures and its sections; the layout, the sizes and the states are here.
 */
export default function AchievementWindow({
  onClose,
  iconUrl,
  earned,
  title,
  description,
  marks,
  figures,
  figureColumns,
  children,
}: {
  onClose: () => void
  /** The badge; none draws no picture. An unearned one is grey. */
  iconUrl: string | null
  earned: boolean
  /** The name; a node when it links (RA's goes to the game). */
  title: ReactNode
  description?: string
  /** The row under the head: pin and showcase toggles, type and grade tags, when it was earned. */
  marks?: ReactNode
  /** The `Figure`s (`look="tile" term`, `className="justify-between"`), laid out as a row. */
  figures: ReactNode
  figureColumns: keyof typeof COLUMNS
  /** The platform's own sections, in their order. */
  children?: ReactNode
}) {
  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      className="gap-5"
      icon={
        iconUrl ? (
          <Image
            src={iconUrl}
            alt=""
            width={40}
            height={40}
            unoptimized
            className={`w-full h-full object-cover rounded-control ${earned ? '' : 'grayscale opacity-60'}`}
          />
        ) : undefined
      }
      title={title}
      hint={description}
    >
      {marks && <div className="flex items-center gap-x-3 gap-y-2 flex-wrap">{marks}</div>}
      <dl className={`grid ${COLUMNS[figureColumns]} gap-2`}>{figures}</dl>
      {children}
    </Modal>
  )
}
