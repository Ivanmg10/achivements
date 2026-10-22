import { useState } from 'react'
import { IconArrowRight } from '@tabler/icons-react'
import type { WelcomeDirection } from '@/hooks/useWelcomeSteps'
import { useLanguage } from '@/context/LanguageContext'
import WelcomePageStep from '@/components/welcome-page/welcome-page-step/WelcomePageStep'
import { PRIMARY_BUTTON } from '@/components/welcome-page/welcomeArt'
import WelcomePageIntroPerk from '@/components/welcome-page/welcome-page-intro-perk/WelcomePageIntroPerk'

/**
 * The first step: thanks for choosing CheevoVault, what it is for in five
 * points (each opens to say more; one open at a time, so the column stays
 * short), and "Start".
 */
export default function WelcomePageIntro({ onNext, direction, focusTitle }: { onNext: () => void; direction: WelcomeDirection; focusTitle: boolean }) {
  const { T } = useLanguage()
  const t = T.welcome.intro
  const [open, setOpen] = useState<number | null>(null)

  return (
    <WelcomePageStep
      kicker={t.kicker}
      title={t.title}
      body={t.body}
      direction={direction}
      focusTitle={focusTitle}
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
              text={perk.text}
              detail={perk.detail}
              open={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
              delayMs={220 + i * 70}
            />
          ))}
        </ul>
      }
    />
  )
}
