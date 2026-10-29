'use client'

import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'
import { firstToUnlock, type CompareRow } from '@/utils/gameCompare'
import GameCompareTableCell from '../game-compare-table-cell/GameCompareTableCell'
import { decimal } from '@/utils/utils'

/**
 * One achievement: badge, name, what it asks and how rare it is, then who
 * has it — the profile's owner, and you when comparing.
 */
export default function GameCompareTableRow({
  row,
  username,
  comparing,
  mineLoading,
}: {
  row: CompareRow
  username: string
  comparing: boolean
  mineLoading: boolean
}) {
  const { T, lang } = useLanguage()
  const first = comparing ? firstToUnlock(row) : null
  const anyone = row.earned || row.mine?.earned === true

  return (
    <li
      id={row.anchor}
      className={`scroll-mt-24 grid grid-cols-[3rem_1fr] gap-3 items-center p-3 rounded-tile bg-bg-main ${
        comparing ? 'sm:grid-cols-[3rem_1fr_9rem_9rem]' : 'sm:grid-cols-[3rem_1fr_10rem]'
      }`}
    >
      {row.iconUrl ? (
        <Image
          src={row.iconUrl}
          alt=""
          width={48}
          height={48}
          className={`w-12 h-12 rounded-lg object-cover ${anyone ? '' : 'grayscale opacity-60'}`}
          unoptimized
        />
      ) : (
        <span aria-hidden="true" className="w-12 h-12 rounded-lg bg-ink/10" />
      )}

      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-sm font-semibold wrap-break-word">{row.title}</p>
        {row.description && <p className="text-xs text-text-secondary line-clamp-2">{row.description}</p>}
        <p className="flex flex-wrap gap-x-2 text-[11px] text-text-secondary">
          {row.points !== undefined && <span>{row.points} pts</span>}
          {row.grade && <span>{T.psn[row.grade]}</span>}
          {row.gamerscore !== undefined && <span>{row.gamerscore} G</span>}
          {row.rarity !== null && <span>{T.psn.rarity.replace('{n}', decimal(row.rarity, lang))}</span>}
        </p>
      </div>

      <div className={`col-span-2 sm:col-span-1 grid gap-2 ${comparing ? 'grid-cols-2 sm:contents' : 'grid-cols-1 sm:contents'}`}>
        <GameCompareTableCell who={username} unlock={row} first={first === 'them'} />
        {comparing && <GameCompareTableCell who={T.userProfile.you} unlock={row.mine} first={first === 'me'} loading={mineLoading} />}
      </div>
    </li>
  )
}
