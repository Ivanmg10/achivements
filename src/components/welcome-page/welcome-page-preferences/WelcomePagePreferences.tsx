import { LayoutGroup, useReducedMotion } from 'framer-motion'
import { IconArrowRight } from '@tabler/icons-react'
import type { WelcomeDirection } from '@/hooks/useWelcomeSteps'
import { LOOK_CHOICES, useWelcomeChoice, type LookChoice } from '@/hooks/useWelcomeChoice'
import { useFontStyle } from '@/hooks/useFontStyle'
import { useGameCardStyle } from '@/hooks/useGameCardStyle'
import { useHomeLayout } from '@/hooks/useHomeLayout'
import { useShapeStyle } from '@/hooks/useShapeStyle'
import { useThemeChoice } from '@/hooks/useThemeChoice'
import { useLanguage } from '@/context/LanguageContext'
import { LANGUAGES } from '@/utils/languages'
import LayoutModalPreview from '@/components/layout-modal/layout-modal-preview/LayoutModalPreview'
import WelcomePageStep from '@/components/welcome-page/welcome-page-step/WelcomePageStep'
import WelcomePageIntroPerk from '@/components/welcome-page/welcome-page-intro-perk/WelcomePageIntroPerk'
import WelcomePagePreferencesDetail from '@/components/welcome-page/welcome-page-preferences-detail/WelcomePagePreferencesDetail'
import WelcomePagePreferencesChoice from '@/components/welcome-page/welcome-page-preferences-choice/WelcomePagePreferencesChoice'
import { PRIMARY_BUTTON, SECONDARY_BUTTON, SECTION_LABEL } from '@/components/welcome-page/welcomeArt'

/**
 * How the app reads and looks, each choice shown on the spot on the same sample
 * home as the Layout modal. The choices are the intro's cards: pressing one grows
 * it into its detail, one decision at a time, and every one is optional. The
 * theme alone opens over the whole step, as it has the most to show. What others
 * see has its own step (`WelcomePagePrivacy`).
 */
export default function WelcomePagePreferences({
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
  const { T, lang, fromBrowser } = useLanguage()
  const { theme } = useThemeChoice()
  const [shape] = useShapeStyle()
  const [font] = useFontStyle()
  const [home] = useHomeLayout()
  const [cards] = useGameCardStyle()
  const { open, returnTo, show, go, close } = useWelcomeChoice()
  const reducedMotion = useReducedMotion()
  const t = T.welcome.prefs
  const h = T.homeLayout
  const layoutId = (choice: LookChoice) => (reducedMotion ? undefined : `welcome-choice-${choice}`)
  // Back from a choice, the step is already there: it does not arrive again.
  const settled = open !== null || returnTo !== null

  const rows: Record<LookChoice, { title: string; value: string }> = {
    theme: { title: T.userTheme.theme, value: T.userTheme[`name_${theme}`] },
    shape: { title: h.shapeLabel, value: shape === 'round' ? h.shapeRound : h.shapeSlanted },
    font: { title: h.fontLabel, value: { barlow: h.fontBarlow, sofia: h.fontSofia, fira: h.fontFira }[font] },
    home: { title: h.label, value: home === 'cover' ? h.cover : h.classic },
    cards: { title: h.cardsLabel, value: cards === 'flat' ? h.cardsFlat : h.cardsTinted },
    language: { title: T.userConfig.language, value: `${LANGUAGES.find((l) => l.id === lang)?.label ?? lang} · ${fromBrowser ? t.detected : t.chosen}` },
  }

  const sample = <LayoutModalPreview font={font} />
  const detail = open && (
    <WelcomePagePreferencesDetail
      index={LOOK_CHOICES.indexOf(open)}
      total={LOOK_CHOICES.length}
      label={rows[open].title}
      layoutId={layoutId(open)}
      onClose={close}
      onGo={(i) => go(LOOK_CHOICES[i])}
      stage={open === 'theme' ? sample : undefined}
      onNext={open === 'theme' ? onNext : undefined}
    >
      <WelcomePagePreferencesChoice choice={open} />
    </WelcomePagePreferencesDetail>
  )

  return (
    <LayoutGroup>
      {open === 'theme' ? (
        detail
      ) : (
        <WelcomePageStep
          kicker={t.kicker}
          title={t.title}
          body={t.body}
          onBack={onBack}
          direction={settled ? 'none' : direction}
          focusTitle={focusTitle && !settled}
          stage={
            <>
              <span className={`${SECTION_LABEL} hidden lg:block mb-2`}>{t.preview}</span>
              <div className="h-56 lg:h-[clamp(13rem,calc(100dvh-27.5rem),34rem)] shadow-2xl shadow-black/30 rounded-card">{sample}</div>
            </>
          }
          asideLabel={t.choices}
          aside={
            detail || (
              <ul className="flex flex-col gap-2.5">
                {LOOK_CHOICES.map((choice, i) => (
                  <WelcomePageIntroPerk
                    key={choice}
                    number={i + 1}
                    title={rows[choice].title}
                    value={rows[choice].value}
                    layoutId={layoutId(choice)}
                    onOpen={() => show(choice)}
                    delayMs={returnTo === null ? 220 + i * 70 : 0}
                    focusOnMount={returnTo === choice}
                  />
                ))}
              </ul>
            )
          }
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
        />
      )}
    </LayoutGroup>
  )
}
