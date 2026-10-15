'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { IconChevronRight, IconHeart, IconUsers } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useFollowCounts } from '@/hooks/useFollowCounts'

const TILE = 'flex items-center gap-3 rounded-xl bg-bg-card ring-1 ring-ink/[0.06] px-3 py-2.5 min-w-0'

function Tile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <>
      <span aria-hidden="true" className="w-9 h-9 shrink-0 rounded-xl bg-bg-main flex items-center justify-center text-text-secondary">
        {icon}
      </span>
      <span className="flex flex-col min-w-0 flex-1">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-lg font-bold tabular-nums leading-tight">{value}</span>
      </span>
    </>
  )
}

/**
 * How many you follow (opening that list) and how many follow you. Only the
 * number of followers: who they are is never shown, to you or anyone.
 */
export default function UserFollowStats() {
  const { T, lang } = useLanguage()
  const { counts, isLoading, error } = useFollowCounts()
  const show = (n: number | undefined) => (isLoading || n === undefined ? '—' : n.toLocaleString(lang))

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/following"
          className={`${TILE} group hover:bg-ink/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70`}
        >
          <Tile icon={<IconUsers size={18} />} label={T.following.title} value={show(counts?.following)} />
          <IconChevronRight size={16} className="shrink-0 text-text-secondary group-hover:text-text-main transition-colors" aria-hidden="true" />
        </Link>
        <div className={TILE}>
          <Tile icon={<IconHeart size={18} />} label={T.following.followers} value={show(counts?.followers)} />
        </div>
      </div>
      {error && <p role="alert" className="text-xs text-red-400">{T.following.countsError}</p>}
    </div>
  )
}
