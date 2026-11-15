import { useState } from 'react'
import { LayoutGroup, useReducedMotion } from 'framer-motion'
import { IconArrowRight } from '@tabler/icons-react'
import type { WelcomeDirection } from '@/hooks/useWelcomeSteps'
import { useLanguage } from '@/context/LanguageContext'
import WelcomePageStep from '@/components/welcome-page/welcome-page-step/WelcomePageStep'
import WelcomePageIntroPerk from '@/components/welcome-page/welcome-page-intro-perk/WelcomePageIntroPerk'
import WelcomePageIntroDetail from '@/components/welcome-page/welcome-page-intro-detail/WelcomePageIntroDetail'
import { PRIMARY_BUTTON } from '@/components/welcome-page/welcomeArt'

/**
 * The first step: thanks for choosing CheevoVault, what it is for in five
 * points, and "Start". A point opens over the whole step, its card growing
 * into it, to explain it with room and a sketch; back, it shrinks into its
 * card again. Without motion, it simply swaps.
 */
export default function WelcomePageIntro({ onNext, direction, focusTitle }: { onNext: () => void; direction: WelcomeDirection; focusTitle: boolean }) {
  const { T } = useLanguage()
  const reducedMotion = useReducedMotion()
  const t = T.welcome.intro
  const [open, setOpen] = useState<number | null>(null)
  // The card the person came back from takes the focus again.
  const [returnTo, setReturnTo] = useState<number | null>(null)
  const layoutId = (i: number) => (reducedMotion ? undefined : `welcome-perk-${i}`)

  function close() {
    setReturnTo(open)
    setOpen(null)
  }

  return (
    <LayoutGroup>
      {open !== null ? (
        <WelcomePageIntroDetail
          index={open}
          total={t.perks.length}
          perk={t.perks[open]}
          layoutId={layoutId(open)}
          onClose={close}
          onGo={setOpen}
          onStart={onNext}
        />
      ) : (
        <WelcomePageStep
          kicker={t.kicker}
          title={t.title}
          body={t.body}
          direction={returnTo === null ? direction : 'none'}
          focusTitle={focusTitle && returnTo === null}
          actions={
            <button type="button" onClick={onNext} className={PRIMARY_BUTTON}>
              {T.welcome.start}
              <IconArrowRight size={16} aria-hidden="true" />
            </button>
          }
          aside={
            <ul className="flex flex-col gap-2.5">
              {t.perks.map((perk, i) => (
                <WelcomePageIntroPerk
                  key={perk.title}
                  number={i + 1}
                  title={perk.title}
                  layoutId={layoutId(i)}
                  onOpen={() => setOpen(i)}
                  delayMs={returnTo === null ? 220 + i * 70 : 0}
                  focusOnMount={returnTo === i}
                />
              ))}
            </ul>
          }
        />
      )}
    </LayoutGroup>
  )
}
