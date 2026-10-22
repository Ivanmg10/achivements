import { IconArrowRight } from '@tabler/icons-react'
import type { WelcomeDirection } from '@/hooks/useWelcomeSteps'
import { useSteamLink } from '@/hooks/useSteamLink'
import { useLanguage } from '@/context/LanguageContext'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import WelcomePageStep from '@/components/welcome-page/welcome-page-step/WelcomePageStep'
import WelcomePageLibraryPreview from '@/components/welcome-page/welcome-page-library-preview/WelcomePageLibraryPreview'
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
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-bg-card ring-1 ring-[#66c0f4]/35">
            <span aria-hidden="true" className="w-13 h-13 rounded-xl flex items-center justify-center text-white" style={{ background: STEP_SKY.steam }}>
              <SteamLogo size={26} aria-hidden="true" />
            </span>
            <span className="flex flex-col gap-0.5 min-w-0">
              <span className="font-bold truncate">{steamUsername}</span>
              <span className="text-[13px] text-text-secondary">{T.welcome.done.linked}</span>
            </span>
          </div>
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
