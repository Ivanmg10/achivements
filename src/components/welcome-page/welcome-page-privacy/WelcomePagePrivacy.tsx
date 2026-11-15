import { useSession } from 'next-auth/react'
import { IconArrowRight, IconBroadcast, IconTrophy, IconWorld } from '@tabler/icons-react'
import type { WelcomeDirection } from '@/hooks/useWelcomeSteps'
import { useVaultMe } from '@/hooks/useVaultMe'
import { useLanguage } from '@/context/LanguageContext'
import UserProfileSwitch from '@/components/user-page/user-profile-switch/UserProfileSwitch'
import WelcomePageStep from '@/components/welcome-page/welcome-page-step/WelcomePageStep'
import WelcomePagePrivacySample from '@/components/welcome-page/welcome-page-privacy-sample/WelcomePagePrivacySample'
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '@/components/welcome-page/welcomeArt'
import styles from '@/components/welcome-page/WelcomePage.module.css'

/**
 * What others see: the account page's three switches, beside a sample that
 * shows what each one does. The rankings switch is there from the first frame,
 * as on the account page, so it does not pop in once the points are read.
 */
export default function WelcomePagePrivacy({
  onNext,
  onSkip,
  onBack,
  direction,
  focusTitle,
}: {
  onNext: () => void
  onSkip: () => void
  onBack: () => void
  direction: WelcomeDirection
  focusTitle: boolean
}) {
  const { data: session } = useSession()
  const { T } = useLanguage()
  const { me: vault, setShowInRankings } = useVaultMe()
  const t = T.welcome.privacy
  const user = session?.user
  const profilePublic = user?.profilePublic !== false
  const showPresence = user?.showPresence !== false
  const showInRankings = vault?.showInRankings ?? true

  return (
    <WelcomePageStep
      kicker={t.kicker}
      title={t.title}
      body={t.body}
      onBack={onBack}
      direction={direction}
      focusTitle={focusTitle}
      asideLabel={t.title}
      aside={<WelcomePagePrivacySample profilePublic={profilePublic} showPresence={showPresence} showInRankings={showInRankings} rank={vault?.rank ?? 0} />}
      actions={
        <>
          <button type="button" onClick={onNext} className={PRIMARY_BUTTON}>
            {T.welcome.next}
            <IconArrowRight size={16} aria-hidden="true" />
          </button>
          <button type="button" onClick={onSkip} className={SECONDARY_BUTTON}>
            {T.welcome.skipStep}
          </button>
        </>
      }
    >
      <div className={`${styles.card} rounded-card bg-bg-card ring-1 ring-ink/[0.06] p-3 flex flex-col max-w-2xl`}>
        <UserProfileSwitch
          field="profilePublic"
          checked={profilePublic}
          label={T.userData.profilePublic}
          onText={T.userData.profilePublicOn}
          offText={T.userData.profilePublicOff}
          icon={<IconWorld size={18} />}
        />
        <UserProfileSwitch
          field="showPresence"
          checked={showPresence}
          label={T.userData.showPresence}
          onText={T.userData.showPresenceOn}
          offText={T.userData.showPresenceOff}
          icon={<IconBroadcast size={18} />}
        />
        <UserProfileSwitch
          field="showInRankings"
          checked={showInRankings}
          label={T.rankings.showInRankings}
          onText={T.rankings.showInRankingsOn}
          offText={T.rankings.showInRankingsOff}
          icon={<IconTrophy size={18} />}
          onSaved={setShowInRankings}
        />
      </div>
    </WelcomePageStep>
  )
}
