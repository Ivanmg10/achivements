'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { IconChevronRight, IconHeart, IconUsers } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useFollowCounts } from '@/hooks/useFollowCounts'

const TILE =
  'group flex items-center gap-3 rounded-control bg-bg-main px-3 py-2.5 min-w-0 hover:bg-ink/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'

/** One count that opens its list. */
function Tile({ href, icon, label, value }: { href: string; icon: ReactNode; label: string; value: string }) {
  return (
    <Link href={href} className={TILE}>
      <span aria-hidden="true" className="w-9 h-9 shrink-0 rounded-chip bg-ink/[0.06] flex items-center justify-center text-text-secondary">
        {icon}
      </span>
      <span className="flex flex-col min-w-0 flex-1">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-lg font-bold tabular-nums leading-tight">{value}</span>
      </span>
      <IconChevronRight size={16} className="shrink-0 text-text-secondary group-hover:text-text-main transition-colors" aria-hidden="true" />
    </Link>
  )
}

/**
 * How many you follow and how many follow you, each opening its list on the
 * Following page (followers: `#followers`, a list only you see).
 */
export default function UserFollowStats() {
  const { T, lang } = useLanguage()
  const { counts, isLoading, error } = useFollowCounts()
  const show = (n: number | undefined) => (isLoading || n === undefined ? '—' : n.toLocaleString(lang))

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-2 gap-3">
        <Tile href="/following" icon={<IconUsers size={18} />} label={T.following.title} value={show(counts?.following)} />
        <Tile href="/following#followers" icon={<IconHeart size={18} />} label={T.following.followers} value={show(counts?.followers)} />
      </div>
      {error && <p role="alert" className="text-xs text-danger">{T.following.countsError}</p>}
    </div>
  )
}
