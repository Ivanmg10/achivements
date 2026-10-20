'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useVaultMe } from '@/hooks/useVaultMe'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'

/** Your level beside the streak, the way to the rankings. Nothing until there are points to show. */
export default function MainHeaderLevel({ glass }: { glass?: boolean }) {
  const { T } = useLanguage()
  const { me } = useVaultMe()
  if (!me || me.points <= 0) return null

  return (
    <Link
      href="/rankings"
      className={`hidden sm:flex items-center rounded-full shrink-0 p-0.5 ring-1 ring-ink/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${glass ? 'bg-ink/10 backdrop-blur-sm hover:bg-ink/20' : 'bg-bg-main hover:bg-bg-main/80'}`}
    >
      <span className="sr-only">{T.rankings.title}</span>
      <VaultLevelBadge points={me.points} compact />
    </Link>
  )
}
