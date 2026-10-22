'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { WELCOME_STEPS, useWelcomeSteps } from '@/hooks/useWelcomeSteps'
import { useWelcomeArrival } from '@/hooks/useWelcomeEntry'
import { useLanguage } from '@/context/LanguageContext'
import { display } from '@/lib/fonts'
import WelcomePageStepsBar, { type WelcomeStepState } from '@/components/welcome-page/welcome-page-steps-bar/WelcomePageStepsBar'
import WelcomePageCurtain from '@/components/welcome-page/welcome-page-curtain/WelcomePageCurtain'
import WelcomeEntryCurtain from '@/components/welcome-entry-curtain/WelcomeEntryCurtain'
import WelcomePageIntro from '@/components/welcome-page/welcome-page-intro/WelcomePageIntro'
import WelcomePageRa from '@/components/welcome-page/welcome-page-ra/WelcomePageRa'
import WelcomePageSteam from '@/components/welcome-page/welcome-page-steam/WelcomePageSteam'
import WelcomePagePsn from '@/components/welcome-page/welcome-page-psn/WelcomePagePsn'
import WelcomePageProfile from '@/components/welcome-page/welcome-page-profile/WelcomePageProfile'
import WelcomePagePreferences from '@/components/welcome-page/welcome-page-preferences/WelcomePagePreferences'
import WelcomePageDone from '@/components/welcome-page/welcome-page-done/WelcomePageDone'
import styles from '@/components/welcome-page/WelcomePage.module.css'

/**
 * Where a new account lands after signing up: what CheevoVault does, then
 * RetroAchievements, Steam and PlayStation one at a time, the profile and the
 * preferences, and the way in. Nothing is required ("not now", "skip all"),
 * every step can be gone back to, and the app's header only comes after.
 * Xbox is not offered: it is admin-only, and a new account is not an admin.
 */
export default function WelcomePage() {
  const { T } = useLanguage()
  const { data: session } = useSession()
  const router = useRouter()
  const steps = useWelcomeSteps()
  // Fresh from sign-up: the curtain that started there finishes here.
  const arriving = useWelcomeArrival()
  // The title takes the focus only once the person has moved, not on arrival.
  const focusTitle = steps.moved

  const user = session?.user
  const linked = { ra: Boolean(user?.rausername), steam: Boolean(user?.steamid), psn: Boolean(user?.psnaccountid) }
  const states: WelcomeStepState[] = WELCOME_STEPS.map((step, i) => {
    if (i === steps.index) return 'current'
    if (step === 'ra' || step === 'steam' || step === 'psn') {
      if (linked[step]) return 'linked'
    } else if (step !== 'done' && i < steps.seen && !steps.skipped.includes(step)) return 'done'
    return steps.skipped.includes(step) ? 'later' : 'pending'
  })

  function finish() {
    steps.finish()
    router.push('/')
  }

  const nav = { onNext: steps.next, onSkip: steps.skip, onBack: steps.back, direction: steps.direction, focusTitle }

  return (
    <div className={`${display.variable} relative min-h-dvh flex flex-col overflow-x-clip bg-bg-main text-text-main`}>
      <div aria-hidden="true" className="fixed inset-x-0 -bottom-8 overflow-hidden pointer-events-none select-none">
        <div className={`${styles.drift} whitespace-nowrap font-display italic font-extrabold text-[clamp(160px,24vw,300px)] leading-[0.9] text-text-main/[0.035]`}>
          {Array(4).fill(T.welcome.words[steps.step]).join(' · ')}
        </div>
      </div>

      <WelcomePageStepsBar
        index={steps.index}
        seen={steps.seen}
        states={states}
        onGo={steps.goTo}
        onBack={steps.back}
        onSkipAll={steps.skipAll}
      />

      {/* Scaled as a whole on big screens (a 2560 px one showed it tiny): `zoom` keeps every
          proportion of the design, which separate text sizes would not. */}
      <main className="relative flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 pt-28 lg:pt-32 pb-16 flex flex-col justify-center 2xl:[zoom:1.2] min-[2200px]:[zoom:1.4]">
        {steps.ready && (
          <div key={steps.step}>
            {steps.step === 'intro' && <WelcomePageIntro onNext={steps.next} direction={steps.direction} focusTitle={focusTitle} />}
            {steps.step === 'ra' && <WelcomePageRa {...nav} />}
            {steps.step === 'steam' && <WelcomePageSteam {...nav} />}
            {steps.step === 'psn' && <WelcomePagePsn {...nav} />}
            {steps.step === 'profile' && <WelcomePageProfile {...nav} />}
            {steps.step === 'prefs' && <WelcomePagePreferences {...nav} />}
            {steps.step === 'done' && (
              <WelcomePageDone linked={linked} onGoTo={steps.goTo} onFinish={finish} onBack={steps.back} direction={steps.direction} focusTitle={focusTitle} />
            )}
          </div>
        )}
      </main>

      {steps.transition && <WelcomePageCurtain transition={steps.transition} />}
      {arriving && <WelcomeEntryCurtain phase="arriving" />}
    </div>
  )
}
