'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useVaultFillState } from '@/context/VaultFillContext'
import { useVaultMe } from '@/hooks/useVaultMe'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'
import Tag from '@/components/ui/Tag'
import { SKELETON_PULSE } from '@/components/ui/Skeleton'

/**
 * Your level beside the streak, the way to the rankings. While your points are
 * being calculated, the badge's own slot in grey with no number (#128: a ring with
 * "99 %" read as a real figure, and could sit there). Nothing until there is either.
 */
export default function MainHeaderLevel({ glass }: { glass?: boolean }) {
  const { T } = useLanguage()
  const { me } = useVaultMe()
  const fill = useVaultFillState()
  const calculating = fill?.active === true
  if (!calculating && (!me || me.points <= 0)) return null

  return (
    <Link
      href="/rankings"
      className="relative tap-target hidden sm:flex items-center shrink-0 rounded-tag transition-[filter] hover:brightness-125 focus-ring"
    >
      <span className="sr-only">{T.rankings.title}</span>
      {calculating ? (
        <span className={SKELETON_PULSE}>
          <Tag slant size="lg" tone={glass ? 'neutral' : 'muted'}>
            {/* The badge's room: its mark and "Lv 00", unseen. */}
            <span aria-hidden="true" className="invisible flex items-center gap-1.5">
              <span className="w-3 h-3" />
              {T.rankings.levelShort.replace('{n}', '00')}
            </span>
            <span className="sr-only">{T.rankings.fillA11y.replace('{pct}', String(fill.pct))}</span>
          </Tag>
        </span>
      ) : (
        me && <VaultLevelBadge points={me.points} compact size="lg" />
      )}
    </Link>
  )
}
