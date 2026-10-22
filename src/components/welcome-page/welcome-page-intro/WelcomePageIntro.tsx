import { IconArrowRight } from '@tabler/icons-react'
import type { WelcomeDirection } from '@/hooks/useWelcomeSteps'
import { useLanguage } from '@/context/LanguageContext'
import WelcomePageStep from '@/components/welcome-page/welcome-page-step/WelcomePageStep'
import { PRIMARY_BUTTON } from '@/components/welcome-page/welcomeArt'
import styles from '@/components/welcome-page/WelcomePage.module.css'

/** The first step: what CheevoVault is for, in five lines, and "Start". */
export default function WelcomePageIntro({ onNext, direction, focusTitle }: { onNext: () => void; direction: WelcomeDirection; focusTitle: boolean }) {
  const { T } = useLanguage()
  const t = T.welcome.intro

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
            <li
              key={perk.title}
              className={`${styles.card} flex items-center gap-3.5 p-3.5 rounded-2xl bg-bg-card ring-1 ring-ink/[0.06]`}
              style={{ animationDelay: `${220 + i * 70}ms` }}
            >
              <span aria-hidden="true" className="w-10 h-10 shrink-0 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-display italic font-extrabold text-lg">
                {i + 1}
              </span>
              <span className="flex flex-col gap-0.5 min-w-0">
                <span className="font-bold text-[15px]">{perk.title}</span>
                <span className="text-[13px] text-text-secondary">{perk.text}</span>
              </span>
            </li>
          ))}
        </ul>
      }
    />
  )
}
