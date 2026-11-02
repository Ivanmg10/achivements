import { IconArrowRight } from '@tabler/icons-react'
import type { WelcomeDirection } from '@/hooks/useWelcomeSteps'
import { useSteamLink } from '@/hooks/useSteamLink'
import { useSteamProfile } from '@/hooks/useSteamProfile'
import { useLanguage } from '@/context/LanguageContext'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import WelcomePageStep from '@/components/welcome-page/welcome-page-step/WelcomePageStep'
import WelcomePageLibraryPreview from '@/components/welcome-page/welcome-page-library-preview/WelcomePageLibraryPreview'
import WelcomePagePlatformLinked from '@/components/welcome-page/welcome-page-platform-linked/WelcomePagePlatformLinked'
import { PRIMARY_BUTTON, SECONDARY_BUTTON, STEP_SKY, platformKicker } from '@/components/welcome-page/welcomeArt'

/**
 * Steam is linked through Steam's own sign-in: a trip there and back to
 * `/welcome`, whose `#steam-…` answer `useSteamLink` toasts. Someone who signed
 * up with Steam finds it already linked here.
 */
export default function WelcomePageSteam({
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
  const { T } = useLanguage()
  const { isLinked, steamUsername, linkHref } = useSteamLink()
  // The Steam picture on the linked card, as the account page's Steam card shows it.
  const { profile } = useSteamProfile()

  return (
    <WelcomePageStep
      kicker={platformKicker(T, 'steam')}
      title={T.welcome.steps.steam}
      body={isLinked ? T.welcome.steam.linked : T.welcome.steam.body}
      onBack={onBack}
      direction={direction}
      focusTitle={focusTitle}
      asideLabel={isLinked ? T.welcome.steps.steam : T.welcome.library.title}
      aside={
        isLinked ? (
          <WelcomePagePlatformLinked
            platform="steam"
            name={profile?.personaname || steamUsername || T.welcome.steps.steam}
            mark={<SteamLogo size={26} aria-hidden="true" />}
            picture={profile?.avatarfull}
          />
        ) : (
          <WelcomePageLibraryPreview art={STEP_SKY.steam} />
        )
      }
      actions={
        isLinked ? (
          <button type="button" onClick={onNext} className={PRIMARY_BUTTON}>
            {T.welcome.next}
            <IconArrowRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <>
            <a href={linkHref} className={PRIMARY_BUTTON}>
              <SteamLogo size={18} aria-hidden="true" />
              {T.welcome.steam.connect}
            </a>
            <button type="button" onClick={onSkip} className={SECONDARY_BUTTON}>
              {T.welcome.notNow}
            </button>
          </>
        )
      }
    />
  )
}
