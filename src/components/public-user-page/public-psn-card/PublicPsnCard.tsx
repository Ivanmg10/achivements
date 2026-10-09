'use client'

import Image from 'next/image'
import { IconExternalLink } from '@tabler/icons-react'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { StatCard } from '@/components/ui/StatPill'
import { useLanguage } from '@/context/LanguageContext'
import { countTrophies } from '@/utils/psnTitles'
import type { PsnSummary } from '@/lib/psnClient'

/** Another user's PlayStation account on their public page: who they are and their four headline numbers. */
export default function PublicPsnCard({ summary }: { summary: PsnSummary }) {
  const { T, lang } = useLanguage()

  return (
    <section aria-label="PlayStation" className="m-3 bg-bg-card rounded-xl p-3 flex flex-col gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {summary.avatarUrl ? (
          <Image src={summary.avatarUrl} alt="" width={56} height={56} className="rounded-lg ring-2 ring-[#0070d1] w-14 h-14 shrink-0" unoptimized />
        ) : (
          <span aria-hidden="true" className="rounded-lg bg-[#003791] w-14 h-14 shrink-0 flex items-center justify-center">
            <PlaystationLogo size={28} className="text-white" />
          </span>
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-lg font-bold truncate">{summary.onlineId}</p>
          <p className="text-xs text-text-secondary">{T.psn.level} {summary.trophyLevel}</p>
        </div>
        <a
          href={`https://profile.playstation.com/${encodeURIComponent(summary.onlineId)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink/8 hover:bg-ink/12 text-text-secondary hover:text-text-main text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070d1]"
        >
          <IconExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          {T.psn.viewOnPsn}
        </a>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <StatCard label={T.steam.statGames} value={summary.games.toLocaleString(lang)} accent="text-[#0070d1]" />
        <StatCard label={T.psn.platinum} value={summary.earned.platinum.toLocaleString(lang)} accent="text-sky-300" />
        <StatCard label={T.psn.trophies} value={countTrophies(summary.earned).toLocaleString(lang)} accent="text-yellow-400" />
      </div>
    </section>
  )
}
