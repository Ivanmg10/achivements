'use client'

import { motion } from 'framer-motion'
import type { RankRow } from '@/app/api/rankings/route'
import { useLanguage } from '@/context/LanguageContext'
import { PODIUM_CARD, PODIUM_DELAY, PODIUM_STEP } from '../rankingsMotion'
import { CountUp } from '@/components/ui/CountUp'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'
import RankingsPageUser from '../rankings-page-user/RankingsPageUser'
import { slantStyle } from '@/components/ui/shape'

/** Second, first and third, as a podium stands: each step's height and colour, the picture's size and ring. */
const STEP: Record<number, string> = {
  1: 'h-[4.5rem] sm:h-[6.25rem] bg-accent text-bg-main',
  2: 'h-12 sm:h-[4.375rem] bg-ink/20 text-text-main',
  3: 'h-9 sm:h-[3.25rem] bg-ink/[0.14] text-text-main',
}
const SIZE = { 1: 'p1', 2: 'p2', 3: 'p3' } as const
const RING: Record<number, string> = {
  1: 'shadow-[0_0_0_3px_rgb(var(--bg-card)),0_0_0_5px_rgb(250_204_21)]',
  2: 'shadow-[0_0_0_3px_rgb(var(--bg-card)),0_0_0_5px_rgb(var(--ink)/0.4)]',
  3: 'shadow-[0_0_0_3px_rgb(var(--bg-card)),0_0_0_5px_rgb(var(--ink)/0.3)]',
}
const SLANT = slantStyle(14)
const STEP_CLASS = 'self-stretch mx-2 sm:mx-3.5 origin-bottom flex items-start justify-center pt-2 font-display italic font-extrabold text-2xl sm:text-[2.125rem] leading-none tabular-nums'

/** The first three, on a podium: picture, name, level and points, with the place on each step. */
export default function RankingsPagePodium({ rows, linked, approx = false }: { rows: RankRow[]; linked: boolean; approx?: boolean }) {
  const { T, lang } = useLanguage()
  // Second, first and third; a place nobody holds yet keeps its empty step, so first stays in the middle.
  const order = [2, 1, 3].map((place) => ({ place, row: rows[place - 1] as RankRow | undefined }))

  return (
    <motion.ol initial="hidden" animate="show" aria-label={T.rankings.title} className="grid grid-cols-[1fr_1.15fr_1fr] gap-2 sm:gap-3.5 items-end">
      {order.map(({ place, row: r }) =>
        !r ? (
          <li key={place} aria-hidden="true" className="flex flex-col justify-end">
            <motion.span variants={PODIUM_STEP} custom={place} style={SLANT} className={`${STEP_CLASS} ${STEP[place]} opacity-40`}>
              {place}
            </motion.span>
          </li>
        ) : (
          <motion.li
            key={r.username}
            variants={PODIUM_CARD}
            custom={place}
            className={`relative rounded-[1.125rem] pt-4 sm:pt-[1.125rem] px-2 sm:px-3.5 flex flex-col items-center gap-1.5 overflow-hidden ring-1 ring-inset ${r.isMe ? 'ring-accent/50' : 'ring-ink/[0.06]'} ${
              place === 1 ? 'bg-[linear-gradient(180deg,rgb(var(--accent)/0.16),rgb(var(--bg-card))_60%)]' : 'bg-bg-card'
            }`}
          >
            <RankingsPageUser
              row={r}
              size={SIZE[place as 1 | 2 | 3]}
              ring={RING[place]}
              linked={linked}
              stacked
              nameClass="text-base sm:text-[1.1875rem] font-extrabold"
            >
              <VaultLevelBadge points={r.totalPoints} compact className="sm:hidden" />
              <VaultLevelBadge points={r.totalPoints} className="hidden sm:inline-flex" />
            </RankingsPageUser>
            <span className="text-lg sm:text-[1.875rem] leading-tight font-extrabold tabular-nums whitespace-nowrap">
              {r.isMe && approx && <span className="text-warning" title={T.rankings.fillApprox}>≈ </span>}
              <CountUp value={r.points} locale={lang} duration={1.2} delay={0.3 + (PODIUM_DELAY[place] ?? 0)} />{' '}
              <span className="text-xs sm:text-[0.8125rem] font-normal text-text-secondary">{T.rankings.vp}</span>
            </span>
            <motion.span variants={PODIUM_STEP} custom={place} style={SLANT} className={`${STEP_CLASS} ${STEP[place]}`}>
              <span className="sr-only">{T.rankings.colRank}</span>
              {r.rank}
            </motion.span>
          </motion.li>
        ),
      )}
    </motion.ol>
  )
}
