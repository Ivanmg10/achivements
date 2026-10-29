'use client'

import Link from 'next/link'
import { IconArrowLeft, IconTrophy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { vaultGuideText } from '@/translations/vaultGuide'
import FaqList from '@/components/faq-list/FaqList'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'
import { TIERS, pointsForLevel } from '@/utils/vaultLevel'
import { difficultyMultiplier, rarityMultiplier } from '@/utils/vaultScore'
import RankingsGuideBlock from './rankings-guide-block/RankingsGuideBlock'
import RankingsGuideTable from './rankings-guide-table/RankingsGuideTable'
import RankingsGuideExample from './rankings-guide-example/RankingsGuideExample'

/** The rarities and reaches the tables show (relative to the game's most common achievement). */
const RARITIES = [1, 0.5, 0.25, 0.1, 0.05, 0.01, 0.001]
const REACHES = [1, 0.5, 0.25, 0.1]

/**
 * "How Vault Points work", for users: why platforms are not simply added up,
 * what makes an achievement and a game worth more, what does not count, the
 * levels, and when points change. Every number shown is worked out from the
 * real formula, so the page cannot say one thing while the code does another.
 */
export default function RankingsGuide() {
  const { T, lang } = useLanguage()
  const g = vaultGuideText(lang)
  const pct = (x: number) => `${(x * 100).toLocaleString(lang, { maximumFractionDigits: 1 })} %`
  const times = (x: number) => `×${x.toLocaleString(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`

  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-6">
      <header
        className="relative overflow-hidden rounded-card ring-1 ring-inset ring-ink/[0.06] p-6 sm:p-10 flex flex-col gap-4"
        style={{ background: 'radial-gradient(ellipse at top left, rgb(var(--accent) / 0.22), transparent 60%), rgb(var(--bg-card))' }}
      >
        <IconTrophy aria-hidden="true" size={240} stroke={1} className="hidden sm:block absolute -right-8 -bottom-10 text-accent/[0.08] pointer-events-none" />
        <Link
          href="/rankings"
          className="relative self-start inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-text-main rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          <IconArrowLeft size={15} aria-hidden="true" />
          {g.back}
        </Link>
        <h1 className="relative flex items-center gap-3 flex-wrap font-display italic font-extrabold text-5xl sm:text-[4.5rem] leading-[0.9] pr-2">
          {g.heading}
          <span className="not-italic font-sans inline-flex items-center h-[1.375rem] px-2 rounded-tag text-xs font-bold bg-accent/15 text-accent">{T.rankings.beta}</span>
        </h1>
        <p className="relative max-w-2xl text-base sm:text-lg text-text-main/85 leading-relaxed">{g.intro}</p>
        <p className="relative self-start max-w-2xl text-[0.8125rem] text-text-secondary bg-black/25 rounded-tile px-3.5 py-2.5">{T.rankings.betaNote}</p>
      </header>

      <RankingsGuideBlock index={1} {...g.bag} />

      <RankingsGuideBlock index={2} {...g.rarity}>
        <RankingsGuideTable
          head={[g.rarity.colRarity, g.rarity.colMultiplier]}
          rows={RARITIES.map((r) => [r === 1 ? g.rarity.everyone : r === 0.001 ? `≤ ${pct(r)}` : pct(r), times(rarityMultiplier(r))])}
          weights={RARITIES.map((r) => rarityMultiplier(r) / rarityMultiplier(RARITIES[RARITIES.length - 1]))}
        />
      </RankingsGuideBlock>

      <RankingsGuideBlock index={3} {...g.difficulty}>
        <RankingsGuideTable
          head={[g.difficulty.colReach, g.difficulty.colMultiplier]}
          rows={REACHES.map((r) => [r === 0.1 ? `≤ ${pct(r)}` : pct(r), times(difficultyMultiplier(r))])}
          weights={REACHES.map((r) => difficultyMultiplier(r) / difficultyMultiplier(REACHES[REACHES.length - 1]))}
        />
      </RankingsGuideBlock>

      <RankingsGuideBlock index={4} {...g.extras} />

      <RankingsGuideBlock index={5} {...g.example}>
        <RankingsGuideExample text={g.example} />
      </RankingsGuideBlock>

      <RankingsGuideBlock index={6} {...g.notCounted} />

      <RankingsGuideBlock index={7} {...g.levels}>
        <div className="bg-bg-main/60 ring-1 ring-inset ring-ink/[0.06] rounded-pane overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-ink/[0.1] text-[0.6875rem] uppercase tracking-[0.08em] text-text-secondary">
                <th scope="col" className="px-4 py-2.5 text-left font-bold">{g.levels.colTier}</th>
                <th scope="col" className="px-4 py-2.5 text-left font-bold">{g.levels.colLevels}</th>
                <th scope="col" className="px-4 py-2.5 text-right font-bold">{g.levels.colFrom}</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((t, i) => {
                const to = TIERS[i + 1] ? TIERS[i + 1].from - 1 : null
                return (
                  <tr key={t.id} className="border-b border-ink/[0.05] last:border-0">
                    <td className="px-4 py-2">
                      <VaultLevelBadge points={pointsForLevel(t.from)} />
                    </td>
                    <td className="px-4 py-2 tabular-nums">{to ? `${t.from}–${to}` : `${t.from}+`}</td>
                    <td className="px-4 py-2 text-right font-bold tabular-nums">
                      {pointsForLevel(t.from).toLocaleString(lang)} <span className="text-[10px] font-semibold text-text-secondary">{T.rankings.vp}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </RankingsGuideBlock>

      <RankingsGuideBlock index={8} {...g.updates} />

      <div className="mt-4"><FaqList title={T.publicPages.faqTitle} items={g.faq} /></div>
    </div>
  )
}
