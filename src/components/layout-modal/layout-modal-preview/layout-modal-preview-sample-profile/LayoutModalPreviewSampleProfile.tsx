'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useVaultMe } from '@/hooks/useVaultMe'
import { levelProgress } from '@/utils/vaultLevel'
import Avatar from '@/components/ui/Avatar'
import Figure from '@/components/ui/Figure'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Skeleton } from '@/components/ui/Skeleton'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'

// What the sample says when there is no session to read (a test): the site's name.
const FALLBACK_NAME = 'CheevoVault'

/**
 * The profile card beside the sample home's recent games, drawn with the person's own name,
 * picture, Vault Points and level bar (#132), so the sample looks like their home and not a mock.
 * The streak stays a fixed 12, as in the sample's top bar: a real one would read the whole year.
 */
export default function LayoutModalPreviewSampleProfile() {
  const { T, lang } = useLanguage()
  const { data: session } = useAuthSession()
  const { me, isLoading } = useVaultMe()
  const user = session?.user
  const points = me?.points ?? 0
  const progress = levelProgress(points)
  const toNext = T.rankings.toLevel.replace('{n}', (progress.span - progress.into).toLocaleString(lang)).replace('{level}', String(progress.level + 1))

  return (
    <aside className="rounded-card bg-bg-card p-3 ring-1 ring-ink/[0.08]">
      <div className="flex items-center gap-3">
        <Avatar src={user?.avatar} name={user?.name ?? FALLBACK_NAME} size={48} />
        <div className="flex min-w-0 flex-col items-start gap-1">
          <p className="max-w-full truncate text-sm font-bold text-text-main">{user?.name ?? FALLBACK_NAME}</p>
          {isLoading ? <Skeleton radius="tag" className="h-5.5 w-16" /> : <VaultLevelBadge points={points} compact />}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Figure look="tile" label={T.rankings.vp} value={points.toLocaleString(lang)} loading={isLoading} />
        <Figure look="tile" label={T.sidePanel.streak} value={12} />
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        <ProgressBar pct={progress.pct} label={toNext} />
        <span className="text-[0.6875rem] text-text-secondary">{toNext}</span>
      </div>
    </aside>
  )
}
