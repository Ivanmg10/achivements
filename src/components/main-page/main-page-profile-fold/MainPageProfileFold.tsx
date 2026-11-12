'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useVaultFillState } from '@/context/VaultFillContext'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useStreakData } from '@/hooks/useStreakData'
import { useVaultMe } from '@/hooks/useVaultMe'
import { plural } from '@/utils/utils'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import StreakTag from '@/components/ui/StreakTag'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'

/** The fold's box, shared with its skeleton so nothing moves when it lands. */
export const FOLD_BOX = 'sm:hidden max-lg:short:flex mx-3 mt-3 flex items-center gap-3 rounded-tile bg-bg-card p-3'

/**
 * The home's profile folded to one line on a phone (#134, MejMovil 7) and on a screen held sideways
 * below lg (`short`, the AYN Thor, #115): picture, name, level and streak, and "See profile" opening the
 * whole column under it, so your games come right after. Elsewhere the column shows as it always did. The streak is the year's
 * (the home reads it anyway), drawn only once the whole year is in; the level waits for the points.
 */
export default function MainPageProfileFold({ open, onToggle, controls }: { open: boolean; onToggle: () => void; controls: string }) {
  const { T, lang } = useLanguage()
  const { data: session } = useAuthSession()
  const { me, isLoading: levelLoading } = useVaultMe()
  const fill = useVaultFillState()
  const { activeStreak, isLoading: streakLoading } = useStreakData()
  const user = session?.user
  const name = user?.name ?? user?.email ?? ''
  const days = activeStreak?.days ?? 0

  return (
    <div className={`${FOLD_BOX} enter-rise`}>
      <Avatar src={user?.avatar ?? user?.image} name={name || '?'} size={40} />
      <div className="min-w-0 flex-1 flex flex-col items-start gap-1">
        <span className="max-w-full truncate font-bold leading-6">{name}</span>
        <span className="flex items-center gap-2 h-6">
          {levelLoading || fill?.active ? (
            <Skeleton radius="tag" className="h-[1.375rem] w-14" />
          ) : (
            me && me.points > 0 && <VaultLevelBadge points={me.points} compact />
          )}
          <StreakTag
            days={streakLoading ? 0 : days}
            // While loading, the room of "00 d", unseen.
            text={T.rankings.daysShort.replace('{n}', streakLoading ? '00' : days.toLocaleString(lang))}
            aria-label={streakLoading ? undefined : `${T.streak.title}: ${plural(days, T.plurals.days, lang)}`}
            loading={streakLoading}
            glow={false}
          />
        </span>
      </div>
      <Button variant="secondary" size="sm" aria-expanded={open} aria-controls={controls} onClick={onToggle}>
        {open ? T.mainPage.hideProfile : T.mainPage.showProfile}
      </Button>
    </div>
  )
}
