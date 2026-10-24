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
    <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <Link
          href="/rankings"
          className="self-start inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-main rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          <IconArrowLeft size={15} aria-hidden="true" />
          {g.back}
        </Link>
        <h1 className="font-display italic font-extrabold text-4xl sm:text-5xl leading-[0.95] pr-1 flex items-center gap-2.5">
          <IconTrophy size={30} className="text-accent shrink-0" aria-hidden="true" />
          {g.heading}
          <span className="text-[10px] uppercase tracking-wider font-bold bg-accent/15 text-accent px-2 py-0.5 rounded-full">{T.rankings.beta}</span>
        </h1>
        <p className="text-base sm:text-lg text-text-secondary leading-relaxed">{g.intro}</p>
        <p className="text-sm text-text-secondary bg-bg-card rounded-xl px-3 py-2">{T.rankings.betaNote}</p>
      </header>

      <RankingsGuideBlock {...g.bag} />

      <RankingsGuideBlock {...g.rarity}>
        <RankingsGuideTable
          head={[g.rarity.colRarity, g.rarity.colMultiplier]}
          rows={RARITIES.map((r) => [r === 1 ? g.rarity.everyone : r === 0.001 ? `≤ ${pct(r)}` : pct(r), times(rarityMultiplier(r))])}
        />
      </RankingsGuideBlock>

      <RankingsGuideBlock {...g.difficulty}>
        <RankingsGuideTable
          head={[g.difficulty.colReach, g.difficulty.colMultiplier]}
          rows={REACHES.map((r) => [r === 0.1 ? `≤ ${pct(r)}` : pct(r), times(difficultyMultiplier(r))])}
        />
      </RankingsGuideBlock>

      <RankingsGuideBlock {...g.extras} />

      <RankingsGuideBlock {...g.example}>
        <RankingsGuideExample text={g.example} />
      </RankingsGuideBlock>

      <RankingsGuideBlock {...g.notCounted} />

      <RankingsGuideBlock {...g.levels}>
        <div className="bg-bg-card rounded-card overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-ink/[0.07] text-[11px] uppercase tracking-wider text-text-secondary">
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

      <RankingsGuideBlock {...g.updates} />

      <FaqList title={T.publicPages.faqTitle} items={g.faq} />
    </div>
  )
}
