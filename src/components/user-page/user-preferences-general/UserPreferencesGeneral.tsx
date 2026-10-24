'use client'

import { useSession } from 'next-auth/react'
import { IconBroadcast, IconEyeOff, IconTrophy, IconGenderBigender, IconLanguage, IconPalette, IconUserShare, IconWorld } from '@tabler/icons-react'
import ProfileField from '@/components/user-page/profile-field/ProfileField'
import UserProfileSwitch from '@/components/user-page/user-profile-switch/UserProfileSwitch'
import { useHiddenGames } from '@/context/HiddenGamesContext'
import { useLanguage } from '@/context/LanguageContext'
import { useTheme } from '@/context/ThemeContext'
import { useVaultMe } from '@/hooks/useVaultMe'
import UserHomeLayoutPreference from '@/components/user-page/user-home-layout-preference/UserHomeLayoutPreference'

const GENDER_KEYS = { male: 'genderMale', female: 'genderFemale', neutral: 'genderNeutral' } as const

/**
 * The preferences that belong to the account, not to a platform: how the app
 * looks and reads, what the profile shows, and the games kept out of the lists.
 * Each line opens the picker it belongs to; nothing here is typed in directly.
 */
export default function UserPreferencesGeneral({
  onOpenTheme,
  onOpenLanguage,
  onOpenGender,
  onOpenHidden,
}: {
  onOpenTheme: () => void
  onOpenLanguage: () => void
  onOpenGender: () => void
  onOpenHidden: () => void
}) {
  const { data: session } = useSession()
  const { lang, T } = useLanguage()
  const { theme } = useTheme()
  const { hidden } = useHiddenGames()
  // Not in the session on purpose: read with the rankings, so a database without it breaks only them.
  const { me: vault, setShowInRankings } = useVaultMe()
  const user = session?.user

  return (
    <div className="flex flex-col gap-1">
      <ProfileField label={T.userTheme.theme} icon={<IconPalette size={18} />} onEdit={onOpenTheme}>
        <span className="flex items-center gap-2 min-w-0">
          <span aria-hidden="true" className="w-4 h-4 rounded-full bg-accent shrink-0" />
          <span className="text-base font-medium truncate">{T.userTheme[`name_${theme}`]}</span>
        </span>
      </ProfileField>

      <ProfileField label={T.userConfig.language} icon={<IconLanguage size={18} />} onEdit={onOpenLanguage}>
        <span className="text-base font-medium uppercase">{lang}</span>
      </ProfileField>

      <UserHomeLayoutPreference />

      <ProfileField
        label={T.userData.gender}
        icon={<IconGenderBigender size={18} />}
        value={user?.gender ? T.userData[GENDER_KEYS[user.gender]] : null}
        empty={T.userData.notSet}
        onEdit={onOpenGender}
      />

      {user?.gender && (
        <UserProfileSwitch
          field="genderPublic"
          checked={user.genderPublic === true}
          label={T.userData.genderPublic}
          onText={T.userData.genderPublicOn}
          offText={T.userData.genderPublicOff}
          icon={<IconUserShare size={18} />}
        />
      )}

      <UserProfileSwitch
        field="profilePublic"
        checked={user?.profilePublic !== false}
        label={T.userData.profilePublic}
        onText={T.userData.profilePublicOn}
        offText={T.userData.profilePublicOff}
        icon={<IconWorld size={18} />}
      />

      <UserProfileSwitch
        field="showPresence"
        checked={user?.showPresence !== false}
        label={T.userData.showPresence}
        onText={T.userData.showPresenceOn}
        offText={T.userData.showPresenceOff}
        icon={<IconBroadcast size={18} />}
      />

      {vault && (
        <UserProfileSwitch
          field="showInRankings"
          checked={vault.showInRankings}
          label={T.rankings.showInRankings}
          onText={T.rankings.showInRankingsOn}
          offText={T.rankings.showInRankingsOff}
          icon={<IconTrophy size={18} />}
          onSaved={setShowInRankings}
        />
      )}

      <ProfileField
        label={T.userPage.hiddenGames}
        icon={<IconEyeOff size={18} />}
        value={hidden.length > 0 ? T.userPage.hiddenCount.replace('{n}', String(hidden.length)) : null}
        empty={T.userPage.hiddenNone}
        onEdit={onOpenHidden}
      />
    </div>
  )
}
