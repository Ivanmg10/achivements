import Image from 'next/image'
import { IconArrowRight } from '@tabler/icons-react'
import type { WelcomeDirection } from '@/hooks/useWelcomeSteps'
import { useSteamLink } from '@/hooks/useSteamLink'
import { useSteamProfile } from '@/hooks/useSteamProfile'
import { useLanguage } from '@/context/LanguageContext'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import VaultFillLine from '@/components/vault-fill-line/VaultFillLine'
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
          <div className="flex items-center gap-3.5 p-4 rounded-card bg-bg-card ring-1 ring-[#66c0f4]/35">
            {profile?.avatarfull ? (
              <Image src={profile.avatarfull} alt="" width={52} height={52} className="w-13 h-13 rounded-xl object-cover shrink-0" unoptimized />
            ) : (
              <span aria-hidden="true" className="w-13 h-13 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: STEP_SKY.steam }}>
                <SteamLogo size={26} aria-hidden="true" />
              </span>
            )}
            <span className="flex flex-col gap-0.5 min-w-0">
              <span className="font-bold truncate">{profile?.personaname || steamUsername}</span>
              <span className="text-[0.8125rem] text-text-secondary">{T.welcome.done.linked}</span>
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
    >
      {/* Its games being read for Vault Points, or why they cannot be (a private profile). */}
      {isLinked && (
        <div className="max-w-md">
          <VaultFillLine source="steam" />
        </div>
      )}
    </WelcomePageStep>
  )
}
